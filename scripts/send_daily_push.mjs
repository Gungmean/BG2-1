/**
 * Bugwang High School 2-1 Daily Web Push Dispatcher
 * 매일 저녁 8시(20:00 KST) 또는 수동 실행 시 등록된 기기들로 웹 푸시 전송
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID 설정
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  process.env.VITE_VAPID_PUBLIC_KEY ||
  'BJcWKihtkSAC2R3R-9FtvmOCfMkXotgaV_8idbZPMG7CKuOnJHqcBYM_5rpcYILpy8to8cd5iRjuSNnD2Ce2yRQ';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'RT5_Wl9n3jKz2ry5vFInij8co7pwGlkQ-1MdtCkSnYU';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:admin@bugwang.hs.kr';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Supabase 클라이언트
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

const TABLE_NAME = 'classboard_records';

async function getSubscriptions() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('ℹ️ Supabase 환경 변수가 설정되지 않아 로컬 모드로 작동합니다.');
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, data')
    .eq('collection', 'push_subscriptions');

  if (error) {
    console.error('❌ 푸시 구독 목록 조회 실패:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    endpoint: row.data?.endpoint,
    keys: row.data?.keys || {},
  }));
}

async function removeExpiredSubscription(id) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('collection', 'push_subscriptions')
    .eq('id', id);
  console.log(`🧹 만료된 유령 구독 삭제 완료 (ID: ${id})`);
}

async function main() {
  console.log('🚀 [부광이일] 웹 푸시 알림 발송 작업 시작...');
  console.log(`📡 VAPID Public Key: ${VAPID_PUBLIC_KEY.slice(0, 15)}...`);

  const subscriptions = await getSubscriptions();
  console.log(`📋 등록된 푸시 수신 기기: 총 ${subscriptions.length}대`);

  if (subscriptions.length === 0) {
    console.log('ℹ️ 발송 대상 기기가 없습니다. 학생들이 웹에서 알림을 켜면 자동으로 등록됩니다.');
    return;
  }

  const payload = JSON.stringify({
    title: '🔔 내일 일정을 확인하세요',
    body: '터치하여 내일의 시간표와 급식을 확인해보세요.',
    data: {
      url: '/?openReport=tomorrow',
      target: 'tomorrowReport',
    },
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'bg2-1-tomorrow-report',
  });

  let successCount = 0;
  let failCount = 0;
  let expiredCount = 0;

  for (const sub of subscriptions) {
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      continue;
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: sub.keys,
    };

    try {
      await webpush.sendNotification(pushSubscription, payload, {
        TTL: 60 * 60 * 12, // 12시간 동안 수신 대기
        urgency: 'high',
      });
      successCount++;
    } catch (err) {
      failCount++;
      // 404 Not Found 또는 410 Gone은 사용자가 알림을 껐거나 브라우저를 삭제한 경우
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredCount++;
        await removeExpiredSubscription(sub.id);
      } else {
        console.warn(`⚠️ 푸시 발송 실패 (${sub.endpoint.slice(0, 30)}...):`, err.message);
      }
    }
  }

  console.log('====================================');
  console.log(`✅ 발송 성공: ${successCount}대`);
  console.log(`❌ 발송 실패: ${failCount}대 (만료 정리: ${expiredCount}대)`);
  console.log('====================================');
}

main().catch((err) => {
  console.error('치명적 오류 발생:', err);
  process.exit(1);
});
