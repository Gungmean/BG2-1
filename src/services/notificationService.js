/**
 * Bugwang High School 2-1 Daily Report Notification Service
 * 매일 저녁 8시(20:00 KST) 내일의 하루 리포트 알림 스케줄러 및 푸시/클릭 이벤트 핸들러
 */

import { getNotices, calculateDDay, getLocalDateString } from './storageService';
import { getSchoolInfoForTomorrow } from './schoolService';
import { savePushSubscription, deletePushSubscription } from './syncService';

const STORAGE_KEY_NOTIFICATION_ENABLED = 'bg2_1_daily_notification_enabled';
const STORAGE_KEY_LAST_NOTIFIED_DATE = 'bg2_1_last_notified_date';

// VAPID 공개키 (Web Push 표준)
const DEFAULT_VAPID_PUBLIC_KEY = 'BJcWKihtkSAC2R3R-9FtvmOCfMkXotgaV_8idbZPMG7CKuOnJHqcBYM_5rpcYILpy8to8cd5iRjuSNnD2Ce2yRQ';
export const VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPID_PUBLIC_KEY) ||
  DEFAULT_VAPID_PUBLIC_KEY;

// Base64 URL 문자열을 Uint8Array로 변환 (PushManager 필수 규격)
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 아이폰(iOS) 기기 여부 확인
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// 홈 화면에 추가된 PWA(Standalone) 모드로 실행 중인지 확인
export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

// 웹 푸시 지원 여부 (Service Worker + PushManager)
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// 알림 활성화 여부 조회 (기본값: true)
export function isNotificationEnabled() {
  const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATION_ENABLED);
  return saved === null ? true : saved === 'true';
}

// 알림 활성화 여부 저장
export function setNotificationEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY_NOTIFICATION_ENABLED, String(enabled));
}

// 브라우저 알림 지원 여부
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// 브라우저 알림 권한 상태 조회
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return typeof window !== 'undefined' && window.Notification ? window.Notification.permission : 'unsupported';
}

// 브라우저 알림 권한 요청
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    if (typeof window !== 'undefined' && window.Notification?.requestPermission) {
      const permission = await window.Notification.requestPermission();
      return permission;
    }
    return 'unsupported';
  } catch (err) {
    console.error('알림 권한 요청 중 오류 발생:', err);
    return typeof window !== 'undefined' && window.Notification ? window.Notification.permission : 'unsupported';
  }
}

/**
 * 현재 브라우저의 웹 푸시 구독 상태 조회
 */
export async function getPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (e) {
    console.warn('푸시 구독 상태 조회 실패:', e);
    return null;
  }
}

/**
 * 웹 푸시(Web Push) 구독 등록 및 서버 저장
 */
export async function subscribeToWebPush() {
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }

  // 아이폰의 경우 PWA로 설치되어 있지 않으면 푸시 알림 불가 안내
  if (isIOS() && !isStandalonePWA()) {
    return { success: false, reason: 'ios_needs_pwa' };
  }

  try {
    // 1. 알림 권한 획득
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    // 2. 서비스 워커 등록 대기
    const registration = await navigator.serviceWorker.ready;

    // 3. 기존 구독 확인 또는 새로 생성
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 4. Supabase에 푸시 토큰 저장
    await savePushSubscription(subscription);
    setNotificationEnabled(true);

    return { success: true, subscription };
  } catch (err) {
    console.error('웹 푸시 구독 생성 중 오류:', err);
    return { success: false, reason: err.message || 'unknown_error' };
  }
}

/**
 * 웹 푸시(Web Push) 구독 해제
 */
export async function unsubscribeFromWebPush() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await deletePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setNotificationEnabled(false);
    return true;
  } catch (err) {
    console.error('웹 푸시 구독 해제 실패:', err);
    setNotificationEnabled(false);
    return false;
  }
}

// 내일의 날짜 계산 (YYYY-MM-DD)
function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
}

// 내일의 요일 계산
function getTomorrowDayName() {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return days[d.getDay()];
}

/**
 * 내일의 학급 일과 요약 텍스트 생성
 */
export async function generateTomorrowSummary() {
  const tomorrowStr = getTomorrowDateString();
  const tomorrowDay = getTomorrowDayName();
  const notices = getNotices();

  // 1. 내일 마감(D-1)인 과제/수행평가 체크
  const targetDateObj = new Date(tomorrowStr + 'T00:00:00');
  const dueTomorrow = notices.filter((n) => {
    const dday = calculateDDay(n, targetDateObj);
    return dday.days === 0 || dday.text === '오늘 종료' || dday.text === 'D-DAY';
  });

  // 2. 내일 급식 및 시간표 가져오기
  let mealSummary = '급식 정보 없음';
  let firstSubject = '';

  try {
    const schoolData = await getSchoolInfoForTomorrow();
    if (schoolData?.meal && schoolData.meal.length > 0) {
      const cleanDishes = schoolData.meal.map((d) => d.replace(/\([^)]*\)/g, '').trim());
      mealSummary = cleanDishes.slice(0, 3).join(', ');
      if (cleanDishes.length > 3) mealSummary += ` 외 ${cleanDishes.length - 3}종`;
    }

    if (schoolData?.timetable && schoolData.timetable.length > 0) {
      const t0 = schoolData.timetable[0];
      firstSubject = typeof t0 === 'object' && t0 !== null ? t0.subject || t0.name || '' : String(t0 || '');
    }
  } catch (e) {
    console.warn('내일 학교 정보 로드 실패:', e);
  }

  // 3. 메시지 본문 조합
  let bodyLines = [];
  bodyLines.push(`🍱 급식: ${mealSummary}`);
  if (firstSubject) {
    bodyLines.push(`📚 1교시 수업: ${firstSubject}`);
  }

  if (dueTomorrow.length > 0) {
    bodyLines.push(`🚨 내일 마감 수행평가: [${dueTomorrow[0].title}] 외 ${dueTomorrow.length - 1}건`);
  } else {
    bodyLines.push(`✨ 내일 마감되는 과제/수행평가가 없습니다.`);
  }

  return {
    title: '🔔 내일 일정을 확인하세요',
    body: '터치하여 내일의 시간표와 급식을 확인해보세요.',
    data: {
      url: '/?openReport=tomorrow',
      target: 'tomorrowReport',
      date: tomorrowStr,
    },
  };
}

/**
 * 서비스 워커 또는 브라우저 Notification을 통한 알림 발송
 */
export async function triggerNotification(summary) {
  if (!isNotificationSupported()) return false;
  if (!window.Notification || window.Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  const notificationOptions = {
    body: summary.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: summary.data,
    tag: 'bg2-1-tomorrow-report',
    renotify: true,
    requireInteraction: false,
  };

  // 서비스 워커가 등록되어 있으면 서비스워커를 통해 발송 (백그라운드 클릭 및 PWA 지원 최적화)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(summary.title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('서비스워커 알림 발송 실패, 일반 Notification으로 대체:', swErr);
    }
  }

  // 일반 Notification 인스턴스 대체
  if (typeof window !== 'undefined' && typeof window.Notification === 'function') {
    try {
      const notif = new window.Notification(summary.title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('OPEN_TOMORROW_REPORT'));
        notif.close();
      };
      return true;
    } catch (err) {
      console.error('Notification 인스턴스 생성 실패:', err);
      return false;
    }
  }
  return false;
}

/**
 * 테스트 알림 즉시 발송
 */
export async function sendTestNotification() {
  const summary = await generateTomorrowSummary();
  return await triggerNotification({
    ...summary,
    title: `🧪 [테스트] ${summary.title}`,
  });
}

/**
 * 매일 저녁 8시(20:00) 정기 스케줄러 가동 및 푸시 상태 동기화
 */
let schedulerInterval = null;

export function initDailyScheduler() {
  if (typeof window === 'undefined') return;
  if (schedulerInterval) clearInterval(schedulerInterval);

  // 권한이 이미 허용되어 있고 알림 켜짐 상태라면 백그라운드 푸시 구독 자동 동기화
  if (
    isNotificationEnabled() &&
    isNotificationSupported() &&
    window.Notification?.permission === 'granted' &&
    isPushSupported()
  ) {
    getPushSubscription().then((existing) => {
      if (!existing && (!isIOS() || isStandalonePWA())) {
        subscribeToWebPush().catch((err) => console.warn('푸시 자동 구독 시도 실패:', err));
      }
    });
  }

  const checkAndNotify = async () => {
    if (!isNotificationEnabled()) return;
    if (!isNotificationSupported() || window.Notification?.permission !== 'granted') return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = getLocalDateString(now);
    const lastNotified = localStorage.getItem(STORAGE_KEY_LAST_NOTIFIED_DATE);

    // 저녁 8시(20시) 정기 발송 (20:00 ~ 20:59 사이에 오늘 아직 발송하지 않았을 경우 1회 발송)
    if (currentHour >= 20 && lastNotified !== todayStr) {
      console.log('🔔 [부광이일] 저녁 8시 내일 리포트 알림 발송 시작:', todayStr);
      const summary = await generateTomorrowSummary();
      const sent = await triggerNotification(summary);
      if (sent) {
        localStorage.setItem(STORAGE_KEY_LAST_NOTIFIED_DATE, todayStr);
        console.log('✅ [부광이일] 저녁 8시 내일 리포트 알림 발송 완료');
      }
    }
  };

  // 즉시 1회 체크 후 매 1분마다 주기적 체크 (앱 실행 중일 때 보조 타이머 역할)
  checkAndNotify();
  schedulerInterval = setInterval(checkAndNotify, 60 * 1000);
}
