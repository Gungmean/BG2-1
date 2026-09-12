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

async function listCollection(collection, fallback) {
  if (!isSupabaseEnabled) return fallback();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, data, updated_at')
    .eq('collection', collection)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn(`Supabase ${collection} load failed, using local fallback`, error);
    return fallback();
  }

  return data.map((row) => ({ id: row.id, ...row.data, updatedAt: row.updated_at }));
}

async function upsertItem(collection, item) {
  if (!isSupabaseEnabled) return item;

  const record = normalizeRecord(item);
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      collection,
      id: record.id,
      data: record,
      updated_at: record.updatedAt
    });

  if (error) throw error;
  return record;
}

async function deleteItem(collection, id) {
  if (!isSupabaseEnabled) return;

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('collection', collection)
    .eq('id', id);

  if (error) throw error;
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
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getNotices() {
  const notices = await listCollection('notices', getLocalNotices);
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
  if (!isSupabaseEnabled) return addLocalNotice(notice);

  const item = {
    id: notice.id || `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: notice.createdAt || new Date().toISOString(),
    pinned: notice.pinned || false,
    ...notice
  };

  await upsertItem('notices', item);
  return getNotices();
}

export async function updateNotice(id, updatedFields) {
  if (!isSupabaseEnabled) return updateLocalNotice(id, updatedFields);

  const current = await getNotices();
  const existing = current.find((item) => item.id === id);
  const item = {
    ...(existing || {}),
    ...updatedFields,
    id,
    updatedAt: new Date().toISOString()
  };

  await upsertItem('notices', item);
  return getNotices();
}

export async function deleteNotice(id) {
  if (!isSupabaseEnabled) return deleteLocalNotice(id);
  await deleteItem('notices', id);
  return getNotices();
}

export async function togglePinNotice(id) {
  if (!isSupabaseEnabled) return toggleLocalPinNotice(id);

  const current = await getNotices();
  const item = current.find((notice) => notice.id === id);
  if (!item) return current;

  await upsertItem('notices', {
    ...item,
    pinned: !item.pinned,
    updatedAt: new Date().toISOString()
  });
  return getNotices();
}

export async function getSuggestions() {
  const suggestions = await listCollection('suggestions', getLocalSuggestions);
  if (isSupabaseEnabled && suggestions.length === 0) {
    const localSuggestions = getLocalSuggestions();
    await Promise.all(localSuggestions.map((suggestion) => upsertItem('suggestions', suggestion)));
    saveSuggestions(localSuggestions);
    return sortByCreatedAtDesc(localSuggestions);
  }
  if (isSupabaseEnabled) saveSuggestions(suggestions);
  return sortByCreatedAtDesc(suggestions);
}

export async function addSuggestion(suggestion) {
  if (!isSupabaseEnabled) return addLocalSuggestion(suggestion);

  const item = {
    id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    upvotes: 0,
    downvotes: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    author: '익명',
    ...suggestion
  };

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
  if (!isSupabaseEnabled) return deleteLocalSuggestion(id);
  await deleteItem('suggestions', id);
  return getSuggestions();
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
