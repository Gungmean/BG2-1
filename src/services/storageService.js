const STORAGE_KEY_NOTICES = 'classboard_notices_v1';
const STORAGE_KEY_APIKEY = 'classboard_gemini_apikey';
const STORAGE_KEY_MONITOR_PIN_HASH = 'classboard_monitor_pin_hash_v1';

export function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

// Default mock notices to initialize the app out-of-the-box
const INITIAL_NOTICES = [
  {
    id: 'n1',
    title: '📝 국어 2학기 1차 수행평가 (독서록 작성 및 제출)',
    content: '지정도서 중 1권을 선택하여 독후감(A4 2매 내외)을 작성 후 국어 수행평가 제출함에 넣어주세요. 작성 양식은 학급 게시판 프린트를 참고하세요.',
    date: getOffsetDate(3),
    category: '수행평가',
    author: '국어 선생님 / 반장',
    pinned: true,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'n2',
    title: '🏫 2026학년도 교내 체육대회 반별 반티 및 응원도구 결정',
    content: '체육대회 반티 후보 3가지 중 학급 투표가 진행 중입니다. 건의함에 투표 용지를 제출하거나 반장에게 의견 전달 바랍니다.',
    date: getOffsetDate(7),
    category: '학교행사',
    author: '체육부장 / 반장',
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'n3',
    title: '🏃 Youth AI SW 아이디어 경진대회 참가자 모집',
    content: '청소년 AI 및 앱 개발 경진대회 참가 안내입니다. 팀(2~4인) 구성 후 과학 정보실로 신청서를 제출하세요.',
    date: getOffsetDate(12),
    category: '외부활동',
    author: '정보 선생님',
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'n4',
    title: '📢 1인 1역 학급 청소 구역 배정 및 청소 일지 작성',
    content: '8월 3차 학급 청소 구역 배정표입니다. 주번과 청소 담당 학생은 방과 후 청소 상태 점검을 받아주세요.',
    date: getOffsetDate(-2),
    category: '기타',
    author: '학급 반장',
    pinned: false,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80'
  }
];

function getOffsetDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateString(d);
}


export function getNotices() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_NOTICES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(INITIAL_NOTICES));
      return INITIAL_NOTICES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load notices from localStorage', e);
    return INITIAL_NOTICES;
  }
}

export function saveNotices(notices) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(notices));
  } catch (e) {
    console.error('Failed to save notices to localStorage', e);
  }
}

export function addNotice(notice) {
  const current = getNotices();
  const newNotice = {
    id: 'notice_' + Date.now(),
    createdAt: new Date().toISOString(),
    pinned: false,
    ...notice
  };
  const updated = [newNotice, ...current];
  saveNotices(updated);
  return updated;
}

export function updateNotice(id, updatedFields) {
  const current = getNotices();
  const updated = current.map(item => item.id === id ? { ...item, ...updatedFields } : item);
  saveNotices(updated);
  return updated;
}

export function deleteNotice(id) {
  const current = getNotices();
  const updated = current.filter(item => item.id !== id);
  saveNotices(updated);
  return updated;
}

export function togglePinNotice(id) {
  const current = getNotices();
  const updated = current.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item);
  saveNotices(updated);
  return updated;
}

/**
 * Calculates D-Day string based on date (YYYY-MM-DD) or notice object with dateType
 */
export function calculateDDay(dateOrNotice) {
  if (!dateOrNotice) return { text: '기한 없음', isExpired: false, days: 999 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dateStr = '';

  // If passed notice object
  if (typeof dateOrNotice === 'object' && dateOrNotice !== null) {
    const { dateType, date, startDate, endDate } = dateOrNotice;

    if (dateType === 'range' && startDate && endDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(0, 0, 0, 0);

      if (today < sDate) {
        const diffDays = Math.ceil((sDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { text: `D-${diffDays} (시작 전)`, isExpired: false, days: diffDays };
      } else if (today >= sDate && today <= eDate) {
        return { text: '진행 중', isExpired: false, days: 0 };
      } else {
        const diffDays = Math.ceil((today.getTime() - eDate.getTime()) / (1000 * 60 * 60 * 24));
        return { text: `마감 (${diffDays}일 경과)`, isExpired: true, days: -diffDays };
      }
    }

    // Fallback to single date
    dateStr = date || startDate || endDate;
  } else {
    dateStr = dateOrNotice;
  }

  if (!dateStr) return { text: '기한 없음', isExpired: false, days: 999 };

  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `마감 (${Math.abs(diffDays)}일 경과)`, isExpired: true, days: diffDays };
  } else if (diffDays === 0) {
    return { text: 'D-DAY (오늘 마감)', isExpired: false, days: 0 };
  } else {
    return { text: `D-${diffDays}`, isExpired: false, days: diffDays };
  }
}

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY_APIKEY) || '';
}

export function setStoredApiKey(key) {
  localStorage.setItem(STORAGE_KEY_APIKEY, key || '');
}

function pureSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  let currentHash = hash.slice(0, 8);
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = currentHash;
    currentHash = currentHash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const temp1 =
        (currentHash[7] +
          (rightRotate(currentHash[4], 6) ^ rightRotate(currentHash[4], 11) ^ rightRotate(currentHash[4], 25)) +
          ((currentHash[4] & currentHash[5]) ^ (~currentHash[4] & currentHash[6])) +
          k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) |
        0;
      const temp2 =
        ((rightRotate(currentHash[0], 2) ^ rightRotate(currentHash[0], 13) ^ rightRotate(currentHash[0], 22)) +
          ((currentHash[0] & currentHash[1]) ^ (currentHash[0] & currentHash[2]) ^ (currentHash[1] & currentHash[2]))) |
        0;
      currentHash = [(temp1 + temp2) | 0, currentHash[0], currentHash[1], currentHash[2], (currentHash[3] + temp1) | 0, currentHash[4], currentHash[5], currentHash[6]];
    }
    for (let i = 0; i < 8; i++) {
      currentHash[i] = (currentHash[i] + oldHash[i]) | 0;
    }
  }
  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (currentHash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

async function hashPin(pin) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
      const bytes = new TextEncoder().encode(pin);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto unavailable or failed, using pure JS SHA-256 fallback', e);
  }
  const utf8 = unescape(encodeURIComponent(String(pin)));
  return pureSha256(utf8);
}

export function hasMonitorPin() {
  return Boolean(localStorage.getItem(STORAGE_KEY_MONITOR_PIN_HASH));
}

export async function setMonitorPin(pin) {
  const hash = await hashPin(pin);
  localStorage.setItem(STORAGE_KEY_MONITOR_PIN_HASH, hash);
  return hash;
}

export async function verifyMonitorPin(pin) {
  const storedHash = localStorage.getItem(STORAGE_KEY_MONITOR_PIN_HASH);
  if (!storedHash) return false;
  const currentHash = await hashPin(pin);
  return storedHash === currentHash;
}

export function resetMonitorPin() {
  localStorage.removeItem(STORAGE_KEY_MONITOR_PIN_HASH);
}

export function exportDataJSON() {
  const notices = getNotices();
  const suggestions = getSuggestions();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ notices, suggestions }, null, 2));
  return dataStr;
}

export function importDataJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      saveNotices(parsed);
      return { success: true, count: parsed.length };
    } else if (parsed && typeof parsed === 'object') {
      if (parsed.notices && Array.isArray(parsed.notices)) saveNotices(parsed.notices);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) saveSuggestions(parsed.suggestions);
      return { success: true, count: (parsed.notices?.length || 0) + (parsed.suggestions?.length || 0) };
    }
    return { success: false, error: '유효한 게시물 데이터 목록 형식이 아닙니다.' };
  } catch (e) {
    return { success: false, error: 'JSON 파싱 오류가 발생했습니다.' };
  }
}

// --- SUGGESTIONS CRUD ---
const STORAGE_KEY_SUGGESTIONS = 'classboard_suggestions_v1';
const STORAGE_KEY_USER_VOTES = 'classboard_user_votes_v1';

const INITIAL_SUGGESTIONS = [
  {
    id: 's1',
    title: '❄️ 오후 수업 시간 교실 에어컨 24도 유지 건의',
    content: '오후 5, 6교시에 햇빛이 들어와 교실이 너무 덥습니다. 수업 집중을 위해 에어컨 온도를 24도로 유지하면 좋겠습니다!',
    category: '시설/환경',
    author: '익명',
    upvotes: 14,
    downvotes: 1,
    status: 'accepted', // 'pending' | 'accepted' | 'completed' | 'rejected'
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 's2',
    title: '🎵 금요일 점심시간 학급 신청곡 틀어주기',
    content: '금요일 점심시간에 학급 스피커로 학생들이 신청한 노래 3~4곡 틀어주면 분위기도 좋아지고 스트레스 풀릴 것 같아요.',
    category: '행사/아이디어',
    author: '익명',
    upvotes: 9,
    downvotes: 2,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 's3',
    title: '🧹 청소 시간 쓰레기 분리수거함 뚜껑 교체 요청',
    content: '플라스틱 분리수거함 뚜껑이 파손되어 냄새가 납니다. 새 뚜껑으로 교체 건의합니다.',
    category: '시설/환경',
    author: '익명',
    upvotes: 6,
    downvotes: 0,
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export function getSuggestions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SUGGESTIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(INITIAL_SUGGESTIONS));
      return INITIAL_SUGGESTIONS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load suggestions', e);
    return INITIAL_SUGGESTIONS;
  }
}

export function saveSuggestions(suggestions) {
  try {
    localStorage.setItem(STORAGE_KEY_SUGGESTIONS, JSON.stringify(suggestions));
  } catch (e) {
    console.error('Failed to save suggestions', e);
  }
}

export function addSuggestion(suggestion) {
  const current = getSuggestions();
  const newSug = {
    id: 'sug_' + Date.now(),
    upvotes: 0,
    downvotes: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    author: '익명',
    ...suggestion
  };
  const updated = [newSug, ...current];
  saveSuggestions(updated);
  return updated;
}

// User Vote Status: returns 'up', 'down', or null
export function getUserVoteStatus(id) {
  try {
    const votesMap = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_VOTES) || '{}');
    return votesMap[id] || null;
  } catch (e) {
    return null;
  }
}

export function voteSuggestion(id, type) {
  // type: 'up' | 'down'
  const current = getSuggestions();
  const votesMap = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_VOTES) || '{}');
  const prevVote = votesMap[id] || null;

  let newVote = null;

  const updated = current.map(item => {
    if (item.id !== id) return item;

    let up = item.upvotes || 0;
    let down = item.downvotes || 0;

    if (prevVote === type) {
      // Toggle off if same button clicked
      if (type === 'up') up = Math.max(0, up - 1);
      if (type === 'down') down = Math.max(0, down - 1);
      newVote = null;
    } else {
      // Switching or new vote
      if (prevVote === 'up') up = Math.max(0, up - 1);
      if (prevVote === 'down') down = Math.max(0, down - 1);

      if (type === 'up') up += 1;
      if (type === 'down') down += 1;
      newVote = type;
    }

    return { ...item, upvotes: up, downvotes: down };
  });

  if (newVote) {
    votesMap[id] = newVote;
  } else {
    delete votesMap[id];
  }

  localStorage.setItem(STORAGE_KEY_USER_VOTES, JSON.stringify(votesMap));
  saveSuggestions(updated);
  return updated;
}

export function updateSuggestionStatus(id, newStatus) {
  const current = getSuggestions();
  const updated = current.map(item => item.id === id ? { ...item, status: newStatus } : item);
  saveSuggestions(updated);
  return updated;
}

export function deleteSuggestion(id) {
  const current = getSuggestions();
  const updated = current.filter(item => item.id !== id);
  saveSuggestions(updated);
  return updated;
}

// --- EXAM PLANS & EVALUATION CRUD ---
const STORAGE_KEY_EXAM_PLANS = 'classboard_exam_plans_v4';

const INITIAL_EXAM_PLANS = [
  {
    id: 'reading_writing',
    subject: '독서와 작문',
    category: '국어',
    teacher: '국어 담당 교사',
    examMethod: '선택형(100)',
    essayRatio: '서술형 40% (논술형: 24%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'rw_p1', title: '서평 쓰기', score: 20, ratio: 20, evalCount: '수시', evalPeriod: '9월~11월', linkedNoticeId: null },
      { id: 'rw_p2', title: '논증적 글쓰기', score: 10, ratio: 10, evalCount: '1회', evalPeriod: '9월', linkedNoticeId: null },
      { id: 'rw_p3', title: '창의적 글쓰기', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '8~12월', linkedNoticeId: null }
    ]
  },
  {
    id: 'english_2',
    subject: '영어2',
    category: '영어',
    teacher: '영어 담당 교사',
    examMethod: '선택형(48) 서술형(12)',
    essayRatio: '42% (논술형: 30%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'en_p1', title: '학교 개선 아이디어 제안 글쓰기', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '9월', linkedNoticeId: null },
      { id: 'en_p2', title: '매시간 어휘퀴즈', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '수시', linkedNoticeId: null },
      { id: 'en_p3', title: '학교캠페인 만화 제작 팀프로젝트', score: 10, ratio: 10, evalCount: '1회', evalPeriod: '11월', linkedNoticeId: null }
    ]
  },
  {
    id: 'calculus_1',
    subject: '미적분1',
    category: '수학',
    teacher: '수학 담당 교사',
    examMethod: '선택형(100)',
    essayRatio: '40% (논술형: 20%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'calc_p1', title: '미적분 개념 문제해결 및 추론', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '10월', linkedNoticeId: null },
      { id: 'calc_p2', title: '미적분 실생활 모델링 탐구', score: 10, ratio: 10, evalCount: '1회', evalPeriod: '11월', linkedNoticeId: null },
      { id: 'calc_p3', title: '수학 성찰 일지', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '수시', linkedNoticeId: null }
    ]
  },
  {
    id: 'geometry',
    subject: '기하',
    category: '수학',
    teacher: '기하 담당 교사',
    examMethod: '선택형(90) 서술형(10)',
    essayRatio: '36% (논술형: 20%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'geo_p1', title: '수학적 원리 활용 탐구 및 발표', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '8월~12월', linkedNoticeId: null },
      { id: 'geo_p2', title: '포트폴리오', score: 20, ratio: 20, evalCount: '수시', evalPeriod: '8월~12월', linkedNoticeId: null }
    ]
  },
  {
    id: 'mechanics_energy',
    subject: '역학과 에너지',
    category: '과학',
    teacher: '물리 담당 교사',
    examMethod: '선택형(100)',
    essayRatio: '35% (논술형: 30%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'me_p1', title: '핵심 개념 구조화', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '수시', linkedNoticeId: null },
      { id: 'me_p2', title: '케플러 법칙과 중력 법칙 분석', score: 15, ratio: 15, evalCount: '1회', evalPeriod: '10월~11월', linkedNoticeId: null },
      { id: 'me_p3', title: '파동 응용 상황 분석', score: 15, ratio: 15, evalCount: '1회', evalPeriod: '11월~12월', linkedNoticeId: null }
    ]
  },
  {
    id: 'cell_metabolism',
    subject: '세포와 물질대사',
    category: '과학',
    teacher: '생명과학 담당 교사',
    examMethod: '선택형(100)',
    essayRatio: '40% (논술형: 25%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'cm_p1', title: '세포호흡과 광합성 과정 탐구분석', score: 15, ratio: 15, evalCount: '1회', evalPeriod: '12월', linkedNoticeId: null },
      { id: 'cm_p2', title: '효소 활성 탐구 설계 및 활용 사례 조사', score: 15, ratio: 15, evalCount: '1회', evalPeriod: '10월', linkedNoticeId: null },
      { id: 'cm_p3', title: '실험탐구 포트폴리오', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '수시', linkedNoticeId: null }
    ]
  },
  {
    id: 'matter_energy',
    subject: '물질과 에너지',
    category: '과학',
    teacher: '화학 담당 교사',
    examMethod: '선택형(100)',
    essayRatio: '38% (논술형: 29%)',
    writtenExam: {
      midterm: { ratio: 30, scope: '', period: '2학기 중간고사' },
      finals: { ratio: 30, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'mat_p1', title: '데이터 해석하기', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '9월~12월', linkedNoticeId: null },
      { id: 'mat_p2', title: '헤스 법칙 확인하기', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '10월', linkedNoticeId: null }
    ]
  },
  {
    id: 'sports_life_2',
    subject: '스포츠생활2',
    category: '체육',
    teacher: '체육 담당 교사',
    examMethod: '지필 미실시',
    essayRatio: '해당없음',
    writtenExam: {
      midterm: { ratio: 0, scope: '', period: '지필 미실시' },
      finals: { ratio: 0, scope: '', period: '지필 미실시' }
    },
    performanceAssessments: [
      { id: 'sl_p1', title: '영역형 스포츠의 스포츠퍼슨십', score: 10, ratio: 10, evalCount: '수시', evalPeriod: '수시', linkedNoticeId: null },
      { id: 'sl_p2', title: '앉아 윗몸 앞으로 굽히기', score: 30, ratio: 30, evalCount: '1회', evalPeriod: '10월', linkedNoticeId: null },
      { id: 'sl_p3', title: '제자리멀리뛰기', score: 30, ratio: 30, evalCount: '1회', evalPeriod: '11월', linkedNoticeId: null },
      { id: 'sl_p4', title: '레이업 슛', score: 30, ratio: 30, evalCount: '1회', evalPeriod: '12월', linkedNoticeId: null }
    ]
  },
  {
    id: 'japanese',
    subject: '일본어',
    category: '제2외국어',
    teacher: '일본어 담당 교사',
    examMethod: '선택형(100) 1회',
    essayRatio: '30% (논술형: 30%)',
    writtenExam: {
      midterm: { ratio: 0, scope: '', period: '중간고사 미실시' },
      finals: { ratio: 50, scope: '', period: '2학기 기말고사' }
    },
    performanceAssessments: [
      { id: 'jp_p1', title: '히라가나 쓰기', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '9월', linkedNoticeId: null },
      { id: 'jp_p2', title: '단어 활용 평가', score: 20, ratio: 20, evalCount: '1회', evalPeriod: '10월~11월', linkedNoticeId: null },
      { id: 'jp_p3', title: '문화 탐구 활동', score: 10, ratio: 10, evalCount: '1회', evalPeriod: '11월', linkedNoticeId: null }
    ]
  }
];

export function getExamPlans() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EXAM_PLANS);
    if (!data) {
      // Migrate previous scope inputs if exists
      const prevDataStr =
        localStorage.getItem('classboard_exam_plans_v3') ||
        localStorage.getItem('classboard_exam_plans_v2');

      let mergedPlans = INITIAL_EXAM_PLANS;
      if (prevDataStr) {
        try {
          const prevPlans = JSON.parse(prevDataStr);
          mergedPlans = INITIAL_EXAM_PLANS.map((plan) => {
            const oldPlan = prevPlans.find(
              (p) => p.subject === plan.subject || p.id === plan.id
            );
            if (oldPlan?.writtenExam) {
              return {
                ...plan,
                writtenExam: {
                  midterm: {
                    ...plan.writtenExam.midterm,
                    scope:
                      oldPlan.writtenExam.midterm?.scope ||
                      plan.writtenExam.midterm.scope
                  },
                  finals: {
                    ...plan.writtenExam.finals,
                    scope:
                      oldPlan.writtenExam.finals?.scope ||
                      plan.writtenExam.finals.scope
                  }
                }
              };
            }
            return plan;
          });
        } catch (err) {
          console.warn('Migration error', err);
        }
      }
      localStorage.setItem(STORAGE_KEY_EXAM_PLANS, JSON.stringify(mergedPlans));
      return mergedPlans;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load exam plans', e);
    return INITIAL_EXAM_PLANS;
  }
}

export function saveExamPlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY_EXAM_PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save exam plans', e);
  }
}

export function updateExamPlan(id, updatedFields) {
  const current = getExamPlans();
  const updated = current.map(item => item.id === id ? { ...item, ...updatedFields } : item);
  saveExamPlans(updated);
  return updated;
}

export function addExamPlan(plan) {
  const current = getExamPlans();
  const newPlan = {
    id: 'exam_' + Date.now(),
    ...plan
  };
  const updated = [...current, newPlan];
  saveExamPlans(updated);
  return updated;
}

export function deleteExamPlan(id) {
  const current = getExamPlans();
  const updated = current.filter(item => item.id !== id);
  saveExamPlans(updated);
  return updated;
}


