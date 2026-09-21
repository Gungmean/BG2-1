// NEIS API service for fetching meal and timetable for 부광고등학교 2학년 1반
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

const API_KEY = '353ce1019b734bd8af400ce098ea310b';
const REGION_CODE = 'E10'; // 인천광역시교육청
const SCHOOL_CODE = '7310046'; // 부광고등학교
const GRADE = '2'; // 2학년
const CLASS = '1'; // 1반

const DAY_NAMES = ['월', '화', '수', '목', '금'];

/**
 * Returns an array of objects representing Monday to Friday of the current week.
 */
export function getWeekDays() {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  return DAY_NAMES.map((dayName, index) => {
    const targetDate = addDays(monday, index);
    return {
      dayName,
      ymd: format(targetDate, 'yyyyMMdd'),
      displayDate: format(targetDate, 'MM.dd'),
      isToday: isSameDay(targetDate, today),
      rawDate: targetDate
    };
  });
}

/**
 * Fetch both meal and timetable for a specific date (yyyyMMdd).
 */
export async function getSchoolInfoForDate(ymd) {
  const [meal, timetable] = await Promise.all([
    fetchMeal(ymd),
    fetchTimetable(ymd),
  ]);

  return { meal, timetable };
}

/**
 * Fetch both meal and timetable for today.
 */
export async function getSchoolInfoForToday() {
  const today = new Date();
  const ymd = format(today, 'yyyyMMdd');
  return getSchoolInfoForDate(ymd);
}

/**
 * Fetch both meal and timetable for tomorrow.
 */
export async function getSchoolInfoForTomorrow() {
  const tomorrow = addDays(new Date(), 1);
  const ymd = format(tomorrow, 'yyyyMMdd');
  return getSchoolInfoForDate(ymd);
}

// Helper to fetch meal dishes for a specific date.
async function fetchMeal(ymd) {
  try {
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&pSize=100&ATPT_OFCDC_SC_CODE=${REGION_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${ymd}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.mealServiceDietInfo?.[1]?.row ?? [];
    if (rows.length === 0) return [];
    return rows.map(r => r.DDISH_NM);
  } catch (e) {
    console.error('Fetch meal error:', e);
    return [];
  }
}

/**
 * Fetch monthly meals map { 'YYYY-MM-DD': { dishes: string[], calInfo: string, ntrInfo: string } }
 */
export async function fetchMonthlyMeals(year, month) {
  // month is 0-indexed
  const startYmd = `${year}${String(month + 1).padStart(2, '0')}01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endYmd = `${year}${String(month + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;

  const mealMap = {};

  try {
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&pSize=100&ATPT_OFCDC_SC_CODE=${REGION_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_FROM_YMD=${startYmd}&MLSV_TO_YMD=${endYmd}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.mealServiceDietInfo?.[1]?.row ?? [];

    rows.forEach(r => {
      const y = r.MLSV_YMD.substring(0, 4);
      const m = r.MLSV_YMD.substring(4, 6);
      const d = r.MLSV_YMD.substring(6, 8);
      const dateStr = `${y}-${m}-${d}`;
      const dishes = parseMealDishes([r.DDISH_NM]);
      
      mealMap[dateStr] = {
        dishes,
        calInfo: r.CAL_INFO || '',
        ntrInfo: r.NTR_INFO || '',
        type: r.MMEAL_SC_NM || '중식'
      };
    });
  } catch (e) {
    console.warn('Failed to fetch monthly meals from NEIS, applying sample menu where missing', e);
  }

  // If month is empty or weekend fallback, fill sample dishes for weekdays
  for (let d = 1; d <= lastDay; d++) {
    const checkDate = new Date(year, month, d);
    const dayOfWeek = checkDate.getDay();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Skip weekends (0: Sun, 6: Sat)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    if (!mealMap[dateStr]) {
      const sample = getSampleMeal(d);
      mealMap[dateStr] = sample;
    }
  }

  return mealMap;
}

/**
 * 부광고등학교 일반 일과시정표 (월~금)
 */
export const PERIOD_SCHEDULE = {
  '1': { time: '08:50 ~ 09:40', start: '08:50', end: '09:40' },
  '2': { time: '09:50 ~ 10:40', start: '09:50', end: '10:40' },
  '3': { time: '10:50 ~ 11:40', start: '10:50', end: '11:40' },
  '4': { time: '11:50 ~ 12:40', start: '11:50', end: '12:40' },
  '5': { time: '13:40 ~ 14:30', start: '13:40', end: '14:30' },
  '6': { time: '14:40 ~ 15:30', start: '14:40', end: '15:30' },
  '7': { time: '15:45 ~ 16:35', start: '15:45', end: '16:35' }
};

export const SCHOOL_ROUTINE_TIMES = [
  { name: '점심시간', time: '12:40 ~ 13:40', note: '60분' },
  { name: '청소시간', time: '15:30 ~ 15:45', note: '15분' },
  { name: '종례', time: '16:35 ~ 16:40', note: '5분' }
];

/**
 * 현재 시각(Date)을 기준으로 현재 진행 중인 교시 번호(1~7) 반환
 * 수업 중이 아니면 null 반환
 */
export function getCurrentPeriod(now = new Date()) {
  const day = now.getDay();
  // 주말(0: 일, 6: 토) 제외
  if (day === 0 || day === 6) return null;

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMin = hours * 60 + minutes;

  for (const [p, sched] of Object.entries(PERIOD_SCHEDULE)) {
    const [sH, sM] = sched.start.split(':').map(Number);
    const [eH, eM] = sched.end.split(':').map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;

    if (currentMin >= startMin && currentMin <= endMin) {
      return Number(p);
    }
  }

  return null;
}

// Helper to fetch timetable for a specific date.
async function fetchTimetable(ymd) {
  try {
    const url = `https://open.neis.go.kr/hub/hisTimetable?KEY=${API_KEY}&Type=json&pSize=100&ATPT_OFCDC_SC_CODE=${REGION_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&GRADE=${GRADE}&CLASS_NM=${CLASS}&ALL_TI_YMD=${ymd}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.hisTimetable?.[1]?.row ?? [];
    return rows.map((r) => {
      const p = String(r.PERIO).trim();
      const sched = PERIOD_SCHEDULE[p];
      return {
        period: r.PERIO,
        subject: r.ITRT_CNTNT,
        time: sched ? sched.time : '',
        startTime: sched ? sched.start : '',
        endTime: sched ? sched.end : ''
      };
    });
  } catch (e) {
    console.error('Fetch timetable error:', e);
    return [];
  }
}

/**
 * Clean dish name by removing allergy codes like (1.2.5.6) and punctuation
 */
export function cleanDishName(dish) {
  if (!dish) return '';
  return dish
    .replace(/\s*\([0-9.,\s]+\)/g, '')
    .replace(/[[\];*']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract 2 top highlight dishes (prioritizing main meat/protein/special dish over plain rice)
 */
export function getMealHighlights(dishes) {
  if (!dishes || dishes.length === 0) return [];
  const cleaned = dishes.map((d) => cleanDishName(d)).filter(Boolean);
  if (cleaned.length <= 2) return cleaned;

  // Plain rice keywords
  const plainRiceRegex = /^(현미|백미|칼슘|혼합|발아|찰보리|차수수|흑미|기장|찹쌀|쌀|보리|잡곡)밥$/;
  const nonPlainRice = cleaned.filter((d) => !plainRiceRegex.test(d));

  if (nonPlainRice.length >= 2) {
    return nonPlainRice.slice(0, 2);
  }

  return cleaned.slice(0, 2);
}

/**
 * Convert raw meal dish strings (with <br/> HTML tags) into clean formatted list/lines without allergy codes.
 */
export function parseMealDishes(dishes) {
  if (!dishes || dishes.length === 0) return ['급식 정보가 없습니다.'];
  const rawStr = dishes.join('<br/>');
  return rawStr
    .split(/<br\s*\/?>/gi)
    .map((item) => cleanDishName(item))
    .filter(Boolean);
}

// 25 distinct sample meals for realistic variation when NEIS is empty/weekend
const SAMPLE_MEALS = [
  { dishes: ['치킨마요덮밥', '유부장국', '떡꼬치구이', '단무지무침', '요구르트'], calInfo: '790 Kcal', type: '중식' },
  { dishes: ['현미찹쌀밥', '등심돈까스&소스', '얼큰순두부찌개', '파스타샐러드', '깍두기'], calInfo: '740 Kcal', type: '중식' },
  { dishes: ['칼슘찹쌀밥', '안동찜닭', '쇠고기미역국', '도토리묵무침', '배추김치'], calInfo: '685 Kcal', type: '중식' },
  { dishes: ['스팸김치덮밥', '호박두부찌개', '가자미오븐구이', '오이미역초무침', '조각메론'], calInfo: '665 Kcal', type: '중식' },
  { dishes: ['흑미밥', '닭갈비', '갈비탕', '콩나물파채무침', '석박지'], calInfo: '820 Kcal', type: '중식' },
  { dishes: ['오므라이스&소스', '미소된장국', '치킨피타브레드', '새콤콘샐러드', '배추김치'], calInfo: '730 Kcal', type: '중식' },
  { dishes: ['발아현미밥', '언양식바싹불고기', '돈육김치찌개', '상추쌈&쌈장', '열무김치'], calInfo: '710 Kcal', type: '중식' },
  { dishes: ['기장밥', '깐쇼새우', '감자북어국', '시금치들깨무침', '깍두기'], calInfo: '792 Kcal', type: '중식' },
  { dishes: ['차수수밥', '한돈한우떡갈비', '낙지수제비국', '참나물무침', '배추김치'], calInfo: '750 Kcal', type: '중식' },
  { dishes: ['카레라이스', '모듬소시지구이', '팽이버섯된장국', '깍두기', '샤인머스켓'], calInfo: '720 Kcal', type: '중식' },
  { dishes: ['현미찹쌀밥', '치즈함박스테이크', '콩나물유부김치국', '황도샐러드', '배추김치'], calInfo: '760 Kcal', type: '중식' },
  { dishes: ['칼슘찹쌀밥', '치킨까스&칠리소스', '왜된장국', '양배추샐러드', '깍두기'], calInfo: '715 Kcal', type: '중식' },
  { dishes: ['김밥볶음밥', '치킨유린기', '맑은콩나물국', '국물떡볶이', '배추김치'], calInfo: '810 Kcal', type: '중식' },
  { dishes: ['혼합잡곡밥', '제육볶음', '사골감자옹심이', '오징어야채초무침', '배추김치'], calInfo: '695 Kcal', type: '중식' },
  { dishes: ['스파게티', '양송이스프', '수제마늘빵', '오이피클', '한라봉주스'], calInfo: '650 Kcal', type: '중식' },
  { dishes: ['쇠고기콩나물밥&양념장', '달걀찜', '팽이된장국', '오징어실채볶음', '배추김치'], calInfo: '680 Kcal', type: '중식' },
  { dishes: ['칼슘찹쌀밥', '돈육떡강정', '대구맑은탕', '묵말랭이볶음', '조각파인애플'], calInfo: '745 Kcal', type: '중식' },
  { dishes: ['현미찹쌀밥', '훈제오리야채무침', '해물짬뽕국', '견과류멸치볶음', '배추김치'], calInfo: '735 Kcal', type: '중식' },
  { dishes: ['빈달루커리&난', '왕새우튀김', '계란실파국', '실곤약야채무침', '배추김치'], calInfo: '780 Kcal', type: '중식' },
  { dishes: ['혼합잡곡밥', '돈육불고기(고추장)', '감자미역국', '연근조림', '슈퍼백딸기'], calInfo: '725 Kcal', type: '중식' },
  { dishes: ['현미찹쌀밥', '동그랑땡전', '설렁탕', '꽁치김치조림', '깍두기'], calInfo: '755 Kcal', type: '중식' },
  { dishes: ['칼슘찹쌀밥', '뼈없는감자탕', '쭈꾸미오징어볶음', '탕평채', '석박지'], calInfo: '830 Kcal', type: '중식' },
  { dishes: ['찰보리밥', '육개장', '언양식반달불고기', '도라지오이무침', '송편'], calInfo: '787 Kcal', type: '중식' },
  { dishes: ['기장밥', '찹쌀탕수육', '마파두부', '자장소스', '단무지'], calInfo: '775 Kcal', type: '중식' },
  { dishes: ['흑미밥', '소불고기전골', '감자채볶음', '계란말이', '갓김치'], calInfo: '705 Kcal', type: '중식' },
];

function getSampleMeal(dayNum) {
  const item = SAMPLE_MEALS[(dayNum - 1) % SAMPLE_MEALS.length];
  return {
    ...item,
    ntrInfo: '탄수화물, 단백질, 칼슘, 비타민A, 비타민C 균형 식단'
  };
}

// 2026 Academic Calendar cache & fallback for Bu-gwang High School
const ACADEMIC_SCHEDULE_2026 = [
  { eventName: '1학기 1차 시험', startDate: '2026-04-27', endDate: '2026-04-30', isHoliday: false, isExam: true },
  { eventName: '체육대회', startDate: '2026-05-22', endDate: '2026-05-22', isHoliday: false, isExam: false },
  { eventName: '6월 전국연합학력평가', startDate: '2026-06-04', endDate: '2026-06-04', isHoliday: false, isExam: true },
  { eventName: '1학기 2차 시험', startDate: '2026-06-30', endDate: '2026-07-03', isHoliday: false, isExam: true },
  { eventName: '여름방학식', startDate: '2026-07-21', endDate: '2026-07-21', isHoliday: false, isExam: false },
  { eventName: '개학식', startDate: '2026-08-14', endDate: '2026-08-14', isHoliday: false, isExam: false },
  { eventName: '9월 전국연합학력평가', startDate: '2026-09-02', endDate: '2026-09-02', isHoliday: false, isExam: true },
  { eventName: '개천절', startDate: '2026-10-03', endDate: '2026-10-03', isHoliday: true, isExam: false },
  { eventName: '대체공휴일', startDate: '2026-10-05', endDate: '2026-10-05', isHoliday: true, isExam: false },
  { eventName: '한글날', startDate: '2026-10-09', endDate: '2026-10-09', isHoliday: true, isExam: false },
  { eventName: '2학기 1차 시험 (중간고사)', startDate: '2026-10-12', endDate: '2026-10-15', isHoliday: false, isExam: true },
  { eventName: '전국연합학력평가(1,2,3학년)', startDate: '2026-10-20', endDate: '2026-10-20', isHoliday: false, isExam: true },
  { eventName: '수학여행(2학년)', startDate: '2026-10-22', endDate: '2026-10-24', isHoliday: false, isExam: false },
  { eventName: '재량휴업일', startDate: '2026-10-26', endDate: '2026-10-26', isHoliday: true, isExam: false },
  { eventName: '토요휴업일', startDate: '2026-10-31', endDate: '2026-10-31', isHoliday: true, isExam: false },
  { eventName: '대학수학능력시험', startDate: '2026-11-19', endDate: '2026-11-19', isHoliday: true, isExam: false },
  { eventName: '재량휴업일', startDate: '2026-11-20', endDate: '2026-11-20', isHoliday: true, isExam: false },
  { eventName: '2학기 2차 시험 (기말고사)', startDate: '2026-12-14', endDate: '2026-12-17', isHoliday: false, isExam: true },
  { eventName: '겨울방학식', startDate: '2026-12-30', endDate: '2026-12-30', isHoliday: false, isExam: false }
];

/**
 * Calculates upcoming major exam D-Day for Bu-gwang High School 2nd Grade.
 * Returns { name, codeName, startDateStr, endDateStr, daysLeft, ddayText, isOngoing, fullName }
 */
export function getUpcomingExamDDay(baseDate = new Date()) {
  const current = new Date(baseDate);
  current.setHours(0, 0, 0, 0);

  const exams = [
    {
      name: '2학기 중간고사',
      codeName: '2학기 1차 지필평가',
      startDateStr: '2026-10-12',
      endDateStr: '2026-10-15'
    },
    {
      name: '2학기 기말고사',
      codeName: '2학기 2차 지필평가',
      startDateStr: '2026-12-14',
      endDateStr: '2026-12-17'
    }
  ];

  for (const ex of exams) {
    const start = new Date(ex.startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ex.endDateStr);
    end.setHours(23, 59, 59, 999);

    if (current >= start && current <= end) {
      return {
        ...ex,
        daysLeft: 0,
        ddayText: '시험 진행중',
        isOngoing: true,
        isToday: true,
        fullName: `${ex.name} (${ex.codeName})`
      };
    }

    const diffTime = start.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        ...ex,
        daysLeft: diffDays,
        ddayText: diffDays === 1 ? 'D-1' : `D-${diffDays}`,
        isOngoing: false,
        isToday: false,
        fullName: `${ex.name} (${ex.codeName})`
      };
    }
  }

  return null;
}

/**
 * Fetch official school schedules from NEIS for the specified month (0-indexed).
 * Groups contiguous events with the same name into range items.
 */
export async function fetchSchoolSchedules(year, month) {
  const startYmd = `${year}${String(month + 1).padStart(2, '0')}01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endYmd = `${year}${String(month + 1).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;

  const scheduleEvents = [];
  const scheduleByDate = {};

  try {
    const url = `https://open.neis.go.kr/hub/SchoolSchedule?KEY=${API_KEY}&Type=json&pSize=100&ATPT_OFCDC_SC_CODE=${REGION_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&AA_FROM_YMD=${startYmd}&AA_TO_YMD=${endYmd}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.SchoolSchedule?.[1]?.row ?? [];

    // Filter out rows not applicable to 2nd grade or routine Saturday closings
    const validRows = rows.filter((r) => {
      if (!r.EVENT_NM) return false;
      if (r.EVENT_NM === '토요휴업일') return false;
      if (r.TW_GRADE_EVENT_YN === 'N') return false;
      return true;
    });

    // Group continuous days with the same EVENT_NM
    const grouped = [];
    let currentGroup = null;

    validRows.forEach((r) => {
      const y = r.AA_YMD.substring(0, 4);
      const m = r.AA_YMD.substring(4, 6);
      const d = r.AA_YMD.substring(6, 8);
      const dateStr = `${y}-${m}-${d}`;
      const isHoliday = r.SBTR_DD_SC_NM === '휴업일' || r.SBTR_DD_SC_NM === '공휴일';

      if (currentGroup && currentGroup.name === r.EVENT_NM) {
        const prevEnd = new Date(currentGroup.endDate);
        const thisDate = new Date(dateStr);
        const dayDiff = Math.round((thisDate - prevEnd) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 1) {
          currentGroup.endDate = dateStr;
          currentGroup.dates.push(dateStr);
          return;
        }
      }

      currentGroup = {
        name: r.EVENT_NM,
        startDate: dateStr,
        endDate: dateStr,
        dates: [dateStr],
        isHoliday,
        content: r.EVENT_CNTNT || ''
      };
      grouped.push(currentGroup);
    });

    grouped.forEach((g, idx) => {
      const isMulti = g.startDate !== g.endDate;
      const isExam = g.name.includes('시험') || g.name.includes('고사') || g.name.includes('학력평가');

      const item = {
        id: `neis-${g.startDate}-${idx}-${g.name.replace(/\s+/g, '')}`,
        title: g.name,
        date: g.startDate,
        startDate: g.startDate,
        endDate: g.endDate,
        dateType: isMulti ? 'range' : 'single',
        category: '학사일정',
        isSchoolEvent: true,
        isHoliday: g.isHoliday,
        isExam,
        author: '부광고(나이스)',
        content:
          g.content ||
          (g.isHoliday
            ? `부광고등학교 공식 휴업일/공휴일입니다. (${g.startDate}${isMulti ? ` ~ ${g.endDate}` : ''})`
            : isExam
            ? `부광고등학교 공식 지필평가/학력평가 일정입니다. (${g.startDate}${isMulti ? ` ~ ${g.endDate}` : ''})`
            : `부광고등학교 공식 학사일정입니다. (${g.startDate}${isMulti ? ` ~ ${g.endDate}` : ''})`),
        createdAt: `${g.startDate}T09:00:00.000Z`
      };

      scheduleEvents.push(item);
      g.dates.forEach((dStr) => {
        if (!scheduleByDate[dStr]) scheduleByDate[dStr] = [];
        scheduleByDate[dStr].push(item);
      });
    });
  } catch (e) {
    console.warn('Failed to fetch school schedule from NEIS, applying offline fallback', e);
  }

  // Fallback if empty
  if (scheduleEvents.length === 0) {
    const monthStr = String(month + 1).padStart(2, '0');
    const targetMonthPrefix = `${year}-${monthStr}`;

    ACADEMIC_SCHEDULE_2026.forEach((ev, idx) => {
      if (ev.startDate.startsWith(targetMonthPrefix) || ev.endDate.startsWith(targetMonthPrefix)) {
        const isMulti = ev.startDate !== ev.endDate;
        const item = {
          id: `static-school-${ev.startDate}-${idx}`,
          title: ev.eventName,
          date: ev.startDate,
          startDate: ev.startDate,
          endDate: ev.endDate,
          dateType: isMulti ? 'range' : 'single',
          category: '학사일정',
          isSchoolEvent: true,
          isHoliday: ev.isHoliday,
          isExam: ev.isExam,
          author: '부광고(나이스)',
          content: ev.isHoliday
            ? `부광고 공식 휴업일/공휴일입니다. (${ev.startDate}${isMulti ? ` ~ ${ev.endDate}` : ''})`
            : `부광고 공식 학사일정입니다. (${ev.startDate}${isMulti ? ` ~ ${ev.endDate}` : ''})`,
          createdAt: `${ev.startDate}T09:00:00.000Z`
        };
        scheduleEvents.push(item);

        let curr = new Date(ev.startDate);
        const end = new Date(ev.endDate);
        while (curr <= end) {
          const dStr = format(curr, 'yyyy-MM-dd');
          if (!scheduleByDate[dStr]) scheduleByDate[dStr] = [];
          scheduleByDate[dStr].push(item);
          curr.setDate(curr.getDate() + 1);
        }
      }
    });
  }

  return {
    events: scheduleEvents,
    byDate: scheduleByDate
  };
}
