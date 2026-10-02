import { createClient } from '@supabase/supabase-js';
import {
  addExamPlan as addLocalExamPlan,
  addNotice as addLocalNotice,
  addSuggestion as addLocalSuggestion,
  deleteExamPlan as deleteLocalExamPlan,
  deleteNotice as deleteLocalNotice,
  deleteSuggestion as deleteLocalSuggestion,
  getExamPlans as getLocalExamPlans,
  getNotices as getLocalNotices,
  getSuggestions as getLocalSuggestions,
  getUserVoteStatus,
  saveExamPlans,
  saveNotices,
  saveSuggestions,
  togglePinNotice as toggleLocalPinNotice,
  updateExamPlan as updateLocalExamPlan,
  updateNotice as updateLocalNotice,
  updateSuggestionStatus as updateLocalSuggestionStatus,
  voteSuggestion as voteLocalSuggestion
} from './storageService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE_NAME = 'classboard_records';

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function normalizeRecord(item) {
  return {
    ...item,
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

async function listCollection(collection, fallback, forceRefresh = false) {
  if (!isSupabaseEnabled) return fallback();

  const syncKey = `classboard_last_sync_${collection}`;
  const lastSync = localStorage.getItem(syncKey);
  const localList = fallback();

  // 1. 강제 새로고침이 아니고 로컬 캐시가 존재하는 경우, 가장 최근 updated_at만 50바이트 초경량 조회
  if (!forceRefresh && lastSync && Array.isArray(localList) && localList.length > 0) {
    try {
      const { data: latestRows, error: checkError } = await supabase
        .from(TABLE_NAME)
        .select('updated_at')
        .eq('collection', collection)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!checkError && latestRows && latestRows.length > 0) {
        const remoteLatest = latestRows[0].updated_at;
        // 서버의 최신 수정일과 로컬 동기화 시점이 일치하거나 이전이면 전체 다운로드 생략 (Egress 0B 달성)
        if (new Date(lastSync).getTime() >= new Date(remoteLatest).getTime()) {
          return localList;
        }
      }
    } catch (e) {
      console.warn('Egress 최적화 체크 실패, 전체 동기화로 진행합니다.', e);
    }
  }

  // 2. 변경 사항이 있을 때만 전체 데이터 조회
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, data, updated_at')
    .eq('collection', collection)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn(`Supabase ${collection} load failed, using local fallback`, error);
    return fallback();
  }

  const items = data.map((row) => ({ id: row.id, ...row.data, updatedAt: row.updated_at }));

  // 최신 동기화 시점 갱신
  if (items.length > 0 && items[0].updatedAt) {
    localStorage.setItem(syncKey, items[0].updatedAt);
  } else {
    localStorage.setItem(syncKey, new Date().toISOString());
  }

  return items;
}

async function upsertItem(collection, item) {
  if (!isSupabaseEnabled) return item;

  const record = normalizeRecord(item);
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({
        collection,
        id: record.id,
        data: record,
        updated_at: record.updatedAt
      });

    if (error) {
      console.error(`[Supabase Error] ${collection} upsert failed:`, error);
    } else {
      // 로컬 동기화 타임스탬프 동기 갱신
      localStorage.setItem(`classboard_last_sync_${collection}`, record.updatedAt);
    }
  } catch (err) {
    console.error(`[Supabase Error] ${collection} upsert exception:`, err);
  }
  return record;
}

async function deleteItem(collection, id) {
  if (!isSupabaseEnabled) return;

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('collection', collection)
      .eq('id', id);

    if (error) {
      console.error(`[Supabase Error] ${collection} delete failed:`, error);
    } else {
      localStorage.setItem(`classboard_last_sync_${collection}`, new Date().toISOString());
    }
  } catch (err) {
    console.error(`[Supabase Error] ${collection} delete exception:`, err);
  }
}

export function subscribeCollection(collection, onChange) {
  if (!isSupabaseEnabled) return () => {};

  const channel = supabase
    .channel(`classboard-${collection}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_NAME,
        filter: `collection=eq.${collection}`
      },
      () => {
        // 실시간 변경 발생 시 캐시 만료 후 갱신 트리거
        localStorage.removeItem(`classboard_last_sync_${collection}`);
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getNotices(forceRefresh = false) {
  const notices = await listCollection('notices', getLocalNotices, forceRefresh);
  if (isSupabaseEnabled && notices.length === 0) {
    const localNotices = getLocalNotices();
    await Promise.all(localNotices.map((notice) => upsertItem('notices', notice)));
    saveNotices(localNotices);
    return sortByCreatedAtDesc(localNotices);
  }
  if (isSupabaseEnabled) saveNotices(notices);
  return sortByCreatedAtDesc(notices);
}

export async function addNotice(notice) {
  const localList = addLocalNotice(notice);
  if (!isSupabaseEnabled) return localList;

  const item = localList.find((n) => n.id === notice.id) || localList[0];
  await upsertItem('notices', item);
  return localList;
}

export async function updateNotice(id, updatedFields) {
  const localList = updateLocalNotice(id, updatedFields);
  if (!isSupabaseEnabled) return localList;

  const item = localList.find((n) => n.id === id);
  if (item) {
    await upsertItem('notices', {
      ...item,
      updatedAt: new Date().toISOString()
    });
  }
  return localList;
}

export async function deleteNotice(id) {
  const localList = deleteLocalNotice(id);
  if (!isSupabaseEnabled) return localList;
  await deleteItem('notices', id);
  return localList;
}

export async function togglePinNotice(id) {
  const localList = toggleLocalPinNotice(id);
  if (!isSupabaseEnabled) return localList;

  const item = localList.find((notice) => notice.id === id);
  if (item) {
    await upsertItem('notices', {
      ...item,
      updatedAt: new Date().toISOString()
    });
  }
  return localList;
}

export async function getSuggestions() {
  const suggestions = await listCollection('suggestions', getLocalSuggestions);
  if (isSupabaseEnabled && suggestions.length === 0) {
    const isSeeded = localStorage.getItem('classboard_suggestions_seeded_v2');
    if (!isSeeded) {
      localStorage.setItem('classboard_suggestions_seeded_v2', 'true');
      const localSuggestions = getLocalSuggestions();
      await Promise.all(localSuggestions.map((suggestion) => upsertItem('suggestions', suggestion)));
      saveSuggestions(localSuggestions);
      return sortByCreatedAtDesc(localSuggestions);
    }
  } else if (isSupabaseEnabled) {
    localStorage.setItem('classboard_suggestions_seeded_v2', 'true');
  }
  if (isSupabaseEnabled) saveSuggestions(suggestions);
  return sortByCreatedAtDesc(suggestions);
}

export async function addSuggestion(suggestion) {
  const localList = addLocalSuggestion(suggestion);
  if (!isSupabaseEnabled) return localList;

  const item = localList.find((s) => s.id === suggestion.id) || localList[0];
  await upsertItem('suggestions', item);
  return getSuggestions();
}

export async function voteSuggestion(id, type) {
  if (!isSupabaseEnabled) return voteLocalSuggestion(id, type);

  const current = await getSuggestions();
  const votesMap = JSON.parse(localStorage.getItem('classboard_user_votes_v1') || '{}');
  const prevVote = votesMap[id] || null;
  let newVote = null;

  const target = current.find((item) => item.id === id);
  if (!target) return current;

  let up = target.upvotes || 0;
  let down = target.downvotes || 0;

  if (prevVote === type) {
    if (type === 'up') up = Math.max(0, up - 1);
    if (type === 'down') down = Math.max(0, down - 1);
    newVote = null;
  } else {
    if (prevVote === 'up') up = Math.max(0, up - 1);
    if (prevVote === 'down') down = Math.max(0, down - 1);
    if (type === 'up') up += 1;
    if (type === 'down') down += 1;
    newVote = type;
  }

  if (newVote) {
    votesMap[id] = newVote;
  } else {
    delete votesMap[id];
  }
  localStorage.setItem('classboard_user_votes_v1', JSON.stringify(votesMap));

  await upsertItem('suggestions', {
    ...target,
    upvotes: up,
    downvotes: down,
    updatedAt: new Date().toISOString()
  });
  return getSuggestions();
}

export async function updateSuggestionStatus(id, newStatus) {
  if (!isSupabaseEnabled) return updateLocalSuggestionStatus(id, newStatus);

  const current = await getSuggestions();
  const item = current.find((suggestion) => suggestion.id === id);
  if (!item) return current;

  await upsertItem('suggestions', {
    ...item,
    status: newStatus,
    updatedAt: new Date().toISOString()
  });
  return getSuggestions();
}

export async function deleteSuggestion(id) {
  const localList = deleteLocalSuggestion(id);
  if (!isSupabaseEnabled) return localList;
  await deleteItem('suggestions', id);
  const fresh = (await listCollection('suggestions', () => localList)).filter((s) => s.id !== id);
  saveSuggestions(fresh);
  return sortByCreatedAtDesc(fresh);
}

export { getUserVoteStatus };

export async function getExamPlans() {
  const plans = await listCollection('exam_plans', getLocalExamPlans);
  if (isSupabaseEnabled && plans.length === 0) {
    const localPlans = getLocalExamPlans();
    await Promise.all(localPlans.map((plan) => upsertItem('exam_plans', plan)));
    saveExamPlans(localPlans);
    return localPlans;
  }
  if (isSupabaseEnabled && plans.length > 0) saveExamPlans(plans);
  return plans.length > 0 ? plans : getLocalExamPlans();
}

export async function updateExamPlan(id, updatedFields) {
  if (!isSupabaseEnabled) return updateLocalExamPlan(id, updatedFields);

  const current = await getExamPlans();
  const existing = current.find((item) => item.id === id);
  const item = {
    ...(existing || {}),
    ...updatedFields,
    id,
    updatedAt: new Date().toISOString()
  };

  await upsertItem('exam_plans', item);
  return getExamPlans();
}

export async function addExamPlan(plan) {
  if (!isSupabaseEnabled) return addLocalExamPlan(plan);

  const item = {
    id: plan.id || `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...plan,
    updatedAt: new Date().toISOString()
  };

  await upsertItem('exam_plans', item);
  return getExamPlans();
}

export async function deleteExamPlan(id) {
  if (!isSupabaseEnabled) return deleteLocalExamPlan(id);
  await deleteItem('exam_plans', id);
  return getExamPlans();
}

// --- PUSH NOTIFICATIONS SUBSCRIPTIONS ---
export async function savePushSubscription(sub) {
  if (!sub || !sub.endpoint) return null;
  const subJson = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
  const safeId = 'sub_' + btoa(sub.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-32);
  const record = {
    id: safeId,
    endpoint: sub.endpoint,
    keys: subJson.keys || {},
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    updatedAt: new Date().toISOString()
  };

  if (!isSupabaseEnabled) {
    try {
      const localSubs = JSON.parse(localStorage.getItem('classboard_push_subs_v1') || '[]');
      const filtered = localSubs.filter((s) => s.endpoint !== sub.endpoint);
      filtered.push(record);
      localStorage.setItem('classboard_push_subs_v1', JSON.stringify(filtered));
    } catch (e) {}
    return record;
  }

  await upsertItem('push_subscriptions', record);
  return record;
}

export async function deletePushSubscription(endpoint) {
  if (!endpoint) return;
  const safeId = 'sub_' + btoa(endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-32);
  if (!isSupabaseEnabled) {
    try {
      const localSubs = JSON.parse(localStorage.getItem('classboard_push_subs_v1') || '[]');
      localStorage.setItem('classboard_push_subs_v1', JSON.stringify(localSubs.filter((s) => s.endpoint !== endpoint)));
    } catch (e) {}
    return;
  }
  await deleteItem('push_subscriptions', safeId);
}
