/**
 * Bugwang High School 2-1 Daily Report Notification Service
 * 매일 저녁 8시(20:00 KST) 내일의 하루 리포트 알림 스케줄러 및 푸시/클릭 이벤트 핸들러
 */

import { getNotices, calculateDDay, getLocalDateString } from './storageService';
import { getSchoolInfoForTomorrow } from './schoolService';

const STORAGE_KEY_NOTIFICATION_ENABLED = 'bg2_1_daily_notification_enabled';
const STORAGE_KEY_LAST_NOTIFIED_DATE = 'bg2_1_last_notified_date';

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
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

// 브라우저 알림 권한 요청
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('알림 권한 요청 중 오류 발생:', err);
    return Notification.permission;
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
  if (Notification.permission !== 'granted') {
    const perm = await requestNotificationPermission();
    if (perm !== 'granted') return false;
  }

  const notificationOptions = {
    body: summary.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
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
  try {
    const notif = new Notification(summary.title, notificationOptions);
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
 * 매일 저녁 8시(20:00) 정기 스케줄러 가동
 */
let schedulerInterval = null;

export function initDailyScheduler() {
  if (typeof window === 'undefined') return;
  if (schedulerInterval) clearInterval(schedulerInterval);

  const checkAndNotify = async () => {
    if (!isNotificationEnabled()) return;
    if (Notification.permission !== 'granted') return;

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

  // 즉시 1회 체크 후 매 1분마다 주기적 체크
  checkAndNotify();
  schedulerInterval = setInterval(checkAndNotify, 60 * 1000);
}
