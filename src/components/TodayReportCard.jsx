import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Utensils,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sun,
  Coffee,
  ArrowRight,
  X,
  Clock,
  Maximize2
} from 'lucide-react';
import {
  getSchoolInfoForToday,
  getSchoolInfoForTomorrow,
  parseMealDishes,
  cleanDishName,
  PERIOD_SCHEDULE,
  getCurrentPeriod
} from '../services/schoolService';
import { calculateDDay, getLocalDateString } from '../services/storageService';
import { addDays, format } from 'date-fns';
import TodayBigReportModal from './TodayBigReportModal';

function TodayReportCard({
  notices = [],
  isCollapsed = false,
  onToggleCollapse,
  onNavigate,
  onSelectNotice
}) {
  const [dayTab, setDayTab] = useState('today'); // 'today' | 'tomorrow'
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState({ meal: [], timetable: [] });
  const [tomorrowData, setTomorrowData] = useState({ meal: [], timetable: [] });
  const [showD7Modal, setShowD7Modal] = useState(false);
  const [showBigReportModal, setShowBigReportModal] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(() => getCurrentPeriod());

  // 30초마다 현재 진행 중인 교시 실시간 업데이트
  useEffect(() => {
    const updatePeriod = () => {
      setCurrentPeriod(getCurrentPeriod());
    };
    const timer = setInterval(updatePeriod, 30000);
    return () => clearInterval(timer);
  }, []);

  // Current Target Date calculation
  const today = new Date();
  const targetDate = dayTab === 'today' ? today : addDays(today, 1);
  const dayIndex = targetDate.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getMonth() + 1;
  const date = targetDate.getDate();
  const dayName = dayNames[dayIndex];
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // Load both Today and Tomorrow data concurrently on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSchoolData() {
      try {
        setLoading(true);
        const [tData, tmData] = await Promise.all([
          getSchoolInfoForToday().catch(() => ({ meal: [], timetable: [] })),
          getSchoolInfoForTomorrow().catch(() => ({ meal: [], timetable: [] }))
        ]);
        if (isMounted) {
          setTodayData({
            meal: parseMealDishes(tData.meal || []),
            timetable: tData.timetable || []
          });
          setTomorrowData({
            meal: parseMealDishes(tmData.meal || []),
            timetable: tmData.timetable || []
          });
        }
      } catch (e) {
        console.warn('School data load failed', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSchoolData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeData = dayTab === 'today' ? todayData : tomorrowData;
  const mealDishes = activeData.meal;
  const timetableList = activeData.timetable;

  // 1. Target Date Due Notices (All '수행평가' due on the selected day)
  const targetDateDueNotices = useMemo(() => {
    return notices
      .filter((n) => n.category === '수행평가' && n.dateType !== 'none' && Boolean(n.date || n.startDate || n.endDate))
      .map((n) => ({ notice: n, dday: calculateDDay(n) }))
      .filter(({ notice, dday }) => {
        if (dday.isExpired) return false;
        // Exact single date match
        if (notice.date === targetDateStr) return true;
        // Range notice match (current day falls inside or is endDate)
        if (notice.dateType === 'range' && notice.startDate && notice.endDate) {
          return targetDateStr >= notice.startDate && targetDateStr <= notice.endDate;
        }
        // D-Day calculation match
        if (dayTab === 'today' && dday.days === 0) return true;
        if (dayTab === 'tomorrow' && dday.days === 1) return true;
        return false;
      });
  }, [notices, targetDateStr, dayTab]);

  // 2. D-7 Upcoming Notices (ONLY D-1 to D-7, strictly EXCLUDING targetDateDueNotices to avoid duplication)
  const upcomingD7Notices = useMemo(() => {
    const dueIds = new Set(targetDateDueNotices.map((item) => item.notice.id));
    return notices
      .filter(
        (n) =>
          n.category === '수행평가' &&
          n.dateType !== 'none' &&
          Boolean(n.date || n.startDate || n.endDate) &&
          !dueIds.has(n.id)
      )
      .map((n) => ({ notice: n, dday: calculateDDay(n) }))
      .filter(({ dday }) => !dday.isExpired && dday.days >= 1 && dday.days <= 7)
      .sort((a, b) => a.dday.days - b.dday.days);
  }, [notices, targetDateDueNotices]);

  // 1. COLLAPSED VIEW (Slim single-row summary bar)
  if (isCollapsed) {
    const todaySummaryDish = todayData.meal.length > 0 ? cleanDishName(todayData.meal[0]) : '';
    const todayFirstSubj =
      todayData.timetable.length > 0
        ? typeof todayData.timetable[0] === 'object'
          ? todayData.timetable[0].subject || todayData.timetable[0].name || ''
          : String(todayData.timetable[0])
        : '';

    return (
      <div
        onClick={onToggleCollapse}
        className="mb-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white dark:from-slate-850 dark:via-slate-850 dark:to-slate-850 border border-blue-200/80 dark:border-slate-750 p-3 sm:px-4 flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="flex items-center gap-2 flex-wrap min-w-0 text-xs">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 shrink-0">
              오늘 하루 리포트 ({today.getMonth() + 1}월 {today.getDate()}일)
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            {todaySummaryDish && (
              <span className="text-slate-600 dark:text-slate-300 truncate font-medium max-w-[130px] sm:max-w-[200px]">
                🍱 {todaySummaryDish}
              </span>
            )}
            {todayFirstSubj && (
              <span className="text-slate-600 dark:text-slate-300 truncate font-medium hidden md:inline">
                📚 1교시: {todayFirstSubj}
              </span>
            )}
            {targetDateDueNotices.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-extrabold text-[10px] shrink-0">
                {`D-DAY 수행평가 (${targetDateDueNotices.length}개)`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBigReportModal(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-all"
            title="오늘 하루 리포트 크게 띄우기"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">크게 보기</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.();
            }}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs shadow-xs flex items-center gap-1 shrink-0 transition-all"
          >
            <span>리포트 펼치기</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BIG REPORT MODAL (COLLAPSED STATE TRIGGER) */}
        <TodayBigReportModal
          isOpen={showBigReportModal}
          onClose={() => setShowBigReportModal(false)}
          todayData={todayData}
          tomorrowData={tomorrowData}
          initialTab={dayTab}
          targetDateDueNotices={targetDateDueNotices}
          upcomingD7Notices={upcomingD7Notices}
          onSelectNotice={onSelectNotice}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  // 2. EXPANDED FULL VIEW
  return (
    <div className="mb-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 dark:from-slate-850 dark:via-slate-850/95 dark:to-slate-850 border border-blue-100 dark:border-slate-750 shadow-sm p-4 sm:p-6 relative overflow-hidden space-y-4 transition-colors">
      {/* Background soft glow decoration */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-blue-200/25 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute right-24 -bottom-8 w-36 h-36 rounded-full bg-indigo-200/20 dark:bg-indigo-600/10 blur-2xl pointer-events-none" />

      {/* HEADER: Title, Today/Tomorrow Tabs & Collapse Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 border-b border-slate-100 dark:border-slate-750 pb-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>하루 리포트</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">부광고 2학년 1반</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>{month}월 {date}일 ({dayName}요일)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                {isWeekend ? '주말 휴일' : '수업일'}
              </span>
            </h2>
          </div>

          {/* Today / Tomorrow Toggle Pill */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-750 border border-slate-300/60 dark:border-slate-700 text-xs font-bold shrink-0 ml-1">
            <button
              type="button"
              onClick={() => setDayTab('today')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dayTab === 'today'
                  ? 'bg-white dark:bg-slate-850 text-blue-700 dark:text-blue-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
              }`}
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => setDayTab('tomorrow')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dayTab === 'tomorrow'
                  ? 'bg-white dark:bg-slate-850 text-blue-700 dark:text-blue-300 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
              }`}
            >
              내일
            </button>
          </div>
        </div>

        {/* Right Actions: Big View, Calendar link & Collapse Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowBigReportModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="오늘 하루 리포트 크게 띄우기 (대형 화면/전체화면)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>크게 보기</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('calendar', 'monthCalendar')}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>달력</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-750 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            title="리포트 접기"
          >
            <span>접기</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* D-7 UPCOMING NOTICES WIDGET (ONLY D-1 to D-7, NO DUPLICATE OF TODAY) */}
      <div className="relative z-10 bg-white/85 dark:bg-slate-800/80 backdrop-blur-xs rounded-2xl border border-blue-100 dark:border-slate-700/60 p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            다가오는 수행평가 <span className="text-rose-600 dark:text-rose-400 text-[11px] font-bold">(D-7)</span>
          </span>
        </div>

        {upcomingD7Notices.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 justify-start sm:justify-end">
            {upcomingD7Notices.slice(0, 3).map(({ notice, dday }) => {
              return (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => setShowD7Modal(true)}
                  className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-750 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center gap-1.5 transition-all text-left"
                >
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                      dday.days <= 2
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {`D-${dday.days}`}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[85px] sm:max-w-[110px]">
                    {notice.title.length > 7 ? `${notice.title.slice(0, 7)}…` : notice.title}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowD7Modal(true)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-0.5 shrink-0 transition-colors shadow-2xs"
            >
              <span>전체 ({upcomingD7Notices.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>다가오는 수행평가(D-1~D-7)가 없습니다.</span>
          </div>
        )}
      </div>

      {/* ALL DUE NOTICES FOR TODAY / TOMORROW (SLIM & FOCUSED ON TITLES) */}
      {targetDateDueNotices.length > 0 && (
        <div className="relative z-10 bg-rose-50/85 dark:bg-rose-950/40 backdrop-blur-xs rounded-2xl border border-rose-200/90 dark:border-rose-900/60 p-2.5 sm:px-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-extrabold text-rose-950 dark:text-rose-200">
              {dayTab === 'today' ? '오늘 마감' : '내일 마감'}
              <span className="text-rose-600 dark:text-rose-400 text-[11px] font-bold ml-1">
                ({targetDateDueNotices.length})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 justify-start sm:justify-end">
            {targetDateDueNotices.map(({ notice }) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => onSelectNotice?.(notice)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200 font-bold text-xs flex items-center gap-1 shadow-2xs hover:shadow-xs transition-all text-left group max-w-[160px] sm:max-w-[220px]"
                title={notice.title}
              >
                <span className="truncate">{notice.title}</span>
                <ChevronRight className="w-3 h-3 text-rose-400 group-hover:text-rose-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MEAL & TIMETABLE (SLIM & READABLE ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
        {/* CARD A: 점심 급식 */}
        <div
          onClick={() => onNavigate?.('calendar', 'schedule')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {dayTab === 'today' ? '오늘의' : '내일의'} 점심 급식
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
              <span>식단표</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {isWeekend ? (
            <div className="py-2 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-1 font-medium">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>주말에는 급식이 제공되지 않습니다.</span>
            </div>
          ) : mealDishes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {mealDishes.slice(0, 5).map((dish, i) => (
                <span
                  key={i}
                  className="px-2 py-0.8 rounded-lg bg-amber-50/80 dark:bg-slate-900/90 border border-amber-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px]"
                >
                  {cleanDishName(dish)}
                </span>
              ))}
              {mealDishes.length > 5 && (
                <span className="px-1.5 py-0.8 rounded-lg bg-slate-100 dark:bg-slate-750 text-slate-500 dark:text-slate-300 font-bold text-[10px]">
                  +{mealDishes.length - 5}
                </span>
              )}
            </div>
          ) : (
            <div className="py-2 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
              {loading ? '급식 정보를 불러오는 중...' : '등록된 급식 메뉴가 없습니다.'}
            </div>
          )}
        </div>

        {/* CARD B: 수업 시간표 */}
        <div
          onClick={() => onNavigate?.('calendar', 'schedule')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                {dayTab === 'today' ? '오늘의' : '내일의'} 수업 시간표
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
              <span>시간표</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {isWeekend ? (
            <div className="py-2 text-center text-slate-400 text-xs flex items-center justify-center gap-1 font-medium">
              <Coffee className="w-4 h-4 text-indigo-400" />
              <span>주말 수업 없음 (재충전의 시간 🌿)</span>
            </div>
          ) : timetableList.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {timetableList.map((item, idx) => {
                const subjectName =
                  typeof item === 'object' && item !== null
                    ? item.subject || item.name || ''
                    : String(item || '');
                const periodNum =
                  typeof item === 'object' && item !== null && item.period
                    ? item.period
                    : idx + 1;
                const timeStr =
                  (typeof item === 'object' && item !== null && item.time) ||
                  PERIOD_SCHEDULE[String(periodNum)]?.time ||
                  '';
                const startTime =
                  (typeof item === 'object' && item !== null && item.startTime) ||
                  PERIOD_SCHEDULE[String(periodNum)]?.start ||
                  '';

                const isCurrentPeriod =
                  dayTab === 'today' &&
                  currentPeriod !== null &&
                  Number(periodNum) === currentPeriod;

                return (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[48px] px-1 py-1 rounded-lg text-center transition-all cursor-default relative ${
                      isCurrentPeriod
                        ? 'bg-white dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-400/50 shadow-[0_0_14px_rgba(99,102,241,0.45)] scale-[1.05] z-10'
                        : 'bg-slate-50 dark:bg-slate-900/90 border border-indigo-100/90 dark:border-slate-700/80 hover:bg-indigo-50/50 dark:hover:bg-slate-800'
                    }`}
                    title={`${periodNum}교시${timeStr ? ` (${timeStr})` : ''} : ${subjectName}${
                      isCurrentPeriod ? ' ★ 현재 진행 중인 수업' : ''
                    }`}
                  >
                    {isCurrentPeriod && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
                      </span>
                    )}
                    <span
                      className={`block text-[9px] leading-tight ${
                        isCurrentPeriod ? 'text-indigo-600 dark:text-indigo-300 font-black' : 'text-indigo-500 dark:text-indigo-400 font-bold'
                      }`}
                    >
                      {periodNum}교시
                    </span>
                    <span
                      className={`block text-[11px] truncate ${
                        isCurrentPeriod
                          ? 'font-black text-indigo-900 dark:text-white'
                          : 'font-extrabold text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {subjectName || '수업'}
                    </span>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                      {startTime}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-2 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
              {loading ? '시간표를 불러오는 중...' : '등록된 시간표 정보가 없습니다.'}
            </div>
          )}
        </div>
      </div>

      {/* D-7 UPCOMING NOTICES MODAL (D-1 to D-7) */}
      {showD7Modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowD7Modal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  다가오는 수행평가 (D-7)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowD7Modal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {upcomingD7Notices.length > 0 ? (
                upcomingD7Notices.map(({ notice, dday }) => {
                  return (
                    <div
                      key={notice.id}
                      onClick={() => {
                        setShowD7Modal(false);
                        onSelectNotice?.(notice);
                      }}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${
                            dday.days <= 2
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {`D-${dday.days}`}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate transition-colors">
                            {notice.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {notice.dateType === 'range'
                              ? `${notice.startDate} ~ ${notice.endDate}`
                              : notice.date || '마감일 미정'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                  다가오는 수행평가가 없습니다.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowD7Modal(false);
                  onNavigate?.('calendar', 'monthCalendar');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>학급 달력에서 전체 일정 확인하기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIG REPORT MODAL (EXPANDED STATE TRIGGER) */}
      <TodayBigReportModal
        isOpen={showBigReportModal}
        onClose={() => setShowBigReportModal(false)}
        todayData={todayData}
        tomorrowData={tomorrowData}
        initialTab={dayTab}
        targetDateDueNotices={targetDateDueNotices}
        upcomingD7Notices={upcomingD7Notices}
        onSelectNotice={onSelectNotice}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default React.memo(TodayReportCard);
