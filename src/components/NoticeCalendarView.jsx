import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Utensils,
  X,
  Eye,
  Sparkles,
  Flame,
  Info,
  Plus
} from 'lucide-react';
import { calculateDDay } from '../services/storageService';
import { fetchMonthlyMeals, fetchSchoolSchedules, cleanDishName, getMealHighlights } from '../services/schoolService';

const CATEGORY_STYLES = {
  수행평가: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', barBg: 'bg-rose-500 text-white' },
  학교행사: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', barBg: 'bg-blue-500 text-white' },
  외부활동: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', barBg: 'bg-emerald-500 text-white' },
  학사일정: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-600', barBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' },
  기타: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500', barBg: 'bg-slate-500 text-white' }
};

export default function NoticeCalendarView({
  notices,
  onSelectNotice,
  initialMode = 'schedule',
  isMonitor = false,
  onAddSchedule,
  onOpenPinModal
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [calendarMode, setCalendarMode] = useState(initialMode); // 'schedule' | 'meal'
  const [selectedDayNotices, setSelectedDayNotices] = useState(null); // { dateStr, notices, dayNum }
  const [selectedDayMeal, setSelectedDayMeal] = useState(null); // { dateStr, dayNum, meal }
  const [monthlyMeals, setMonthlyMeals] = useState({});
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [schoolSchedules, setSchoolSchedules] = useState({ events: [], byDate: {} });
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Fetch meals whenever month or year changes
  useEffect(() => {
    let isMounted = true;
    setLoadingMeals(true);
    fetchMonthlyMeals(year, month)
      .then((data) => {
        if (isMounted) setMonthlyMeals(data);
      })
      .finally(() => {
        if (isMounted) setLoadingMeals(false);
      });

    return () => {
      isMounted = false;
    };
  }, [year, month]);

  // Fetch official NEIS school schedules whenever month or year changes
  useEffect(() => {
    let isMounted = true;
    setLoadingSchedule(true);
    fetchSchoolSchedules(year, month)
      .then((data) => {
        if (isMounted) setSchoolSchedules(data);
      })
      .finally(() => {
        if (isMounted) setLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, [year, month]);

  // Prev / Next month handlers
  const handlePrevMonth = () => {
    const nextDate = new Date(year, month - 1, 1);
    setCurrentDate(nextDate);
    const today = new Date();
    if (today.getFullYear() === nextDate.getFullYear() && today.getMonth() === nextDate.getMonth()) {
      setSelectedDateStr(formatDateStr(today));
    } else {
      setSelectedDateStr(formatDateStr(nextDate));
    }
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month + 1, 1);
    setCurrentDate(nextDate);
    const today = new Date();
    if (today.getFullYear() === nextDate.getFullYear() && today.getMonth() === nextDate.getMonth()) {
      setSelectedDateStr(formatDateStr(today));
    } else {
      setSelectedDateStr(formatDateStr(nextDate));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatDateStr(today));
  };

  // Combine official school schedules and classroom notices (strictly excluding notices without dates)
  const allCalendarNotices = useMemo(() => {
    const validNotices = notices.filter(
      (n) => n.dateType !== 'none' && Boolean(n.date || n.startDate || n.endDate)
    );
    return [...(schoolSchedules.events || []), ...validNotices];
  }, [schoolSchedules.events, notices]);

  // Group notices by YYYY-MM-DD
  const noticesByDate = useMemo(() => {
    const map = {};
    allCalendarNotices.forEach((n) => {
      if (n.dateType === 'range' && n.startDate && n.endDate) {
        let curr = new Date(n.startDate);
        const end = new Date(n.endDate);
        curr.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        while (curr <= end) {
          const dateStr = formatDateStr(curr);
          if (!map[dateStr]) map[dateStr] = [];
          if (!map[dateStr].some((item) => item.id === n.id)) {
            map[dateStr].push(n);
          }
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        const targetDateStr = n.date || n.startDate || n.endDate;
        if (targetDateStr) {
          if (!map[targetDateStr]) map[targetDateStr] = [];
          if (!map[targetDateStr].some((item) => item.id === n.id)) {
            map[targetDateStr].push(n);
          }
        }
      }
    });
    return map;
  }, [allCalendarNotices]);

  // Build calendar matrix (35 or 42 cells)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const cells = [];

    // Prev month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatDateStr(prevDate);
      cells.push({
        date: prevDate,
        dateStr,
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: isSameDate(prevDate, new Date())
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateStr(date);
      cells.push({
        date,
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: isSameDate(date, new Date())
      });
    }

    // Next month padding days
    const remainingCells = (cells.length > 35 ? 42 : 35) - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = formatDateStr(nextDate);
      cells.push({
        date: nextDate,
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: isSameDate(nextDate, new Date())
      });
    }

    return cells;
  }, [year, month]);

  // Group cells into weeks (7 days per row)
  const weeks = useMemo(() => {
    const list = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      list.push(calendarCells.slice(i, i + 7));
    }
    return list;
  }, [calendarCells]);

  function formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function isSameDate(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function isNoticeActiveOnDate(dateStr, notice) {
    if (!dateStr || !notice) return false;
    if (notice.dateType === 'range' && notice.startDate && notice.endDate) {
      return dateStr >= notice.startDate && dateStr <= notice.endDate;
    }
    const target = notice.date || notice.startDate || notice.endDate;
    return dateStr === target;
  }

  function isNoticeMultiDay(notice) {
    return Boolean(
      notice &&
      notice.dateType === 'range' &&
      notice.startDate &&
      notice.endDate &&
      notice.startDate !== notice.endDate
    );
  }

  function getWeekTrackLayout(weekCells) {
    const activeNotices = [];
    const activeNoticeIds = new Set();

    allCalendarNotices.forEach((n) => {
      let isActiveInWeek = false;
      for (let d = 0; d < 7; d++) {
        if (isNoticeActiveOnDate(weekCells[d].dateStr, n)) {
          isActiveInWeek = true;
          break;
        }
      }
      if (isActiveInWeek && !activeNoticeIds.has(n.id)) {
        activeNoticeIds.add(n.id);
        activeNotices.push({
          notice: n,
          isMultiDay: isNoticeMultiDay(n),
          startDate: n.startDate || n.date || '',
          endDate: n.endDate || n.date || ''
        });
      }
    });

    // Sort: Official school events & multi-day spans first
    activeNotices.sort((a, b) => {
      if (a.notice.isSchoolEvent && !b.notice.isSchoolEvent) return -1;
      if (!a.notice.isSchoolEvent && b.notice.isSchoolEvent) return 1;
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return (b.endDate || '').localeCompare(a.endDate || '');
    });

    const tracks = [];
    const noticeTrackMap = {};

    activeNotices.forEach(({ notice }) => {
      const activeDays = [];
      for (let d = 0; d < 7; d++) {
        if (isNoticeActiveOnDate(weekCells[d].dateStr, notice)) {
          activeDays.push(d);
        }
      }

      let assignedTrack = -1;
      for (let t = 0; t < tracks.length; t++) {
        const isFree = activeDays.every((d) => !tracks[t][d]);
        if (isFree) {
          assignedTrack = t;
          break;
        }
      }

      if (assignedTrack === -1) {
        assignedTrack = tracks.length;
        tracks.push(new Array(7).fill(null));
      }

      activeDays.forEach((d) => {
        tracks[assignedTrack][d] = notice;
      });
      noticeTrackMap[notice.id] = assignedTrack;
    });

    return { tracks, noticeTrackMap };
  }

  const handleCellClick = (cell) => {
    setSelectedDateStr(cell.dateStr);

    if (!cell.isCurrentMonth) {
      setCurrentDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }

    // PC/태블릿(sm 이상)에서는 기존처럼 클릭 시 모달 팝업도 함께 제공
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      if (calendarMode === 'schedule') {
        const dayNotices = noticesByDate[cell.dateStr] || [];
        setSelectedDayNotices({
          dateStr: cell.dateStr,
          dayNum: cell.dayNum,
          notices: dayNotices
        });
      } else {
        const meal = monthlyMeals[cell.dateStr];
        if (meal && meal.dishes && meal.dishes.length > 0) {
          setSelectedDayMeal({
            dateStr: cell.dateStr,
            dayNum: cell.dayNum,
            meal
          });
        }
      }
    }
  };

  const selectedDateFormattedText = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return `${m}월 ${d}일 (${dayNames[dateObj.getDay()]})`;
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const selectedNotices = noticesByDate[selectedDateStr] || [];
  const selectedMeal = monthlyMeals[selectedDateStr];

  return (
    <div className="space-y-4">
      {/* Calendar Header Card with Motion */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        
        {/* Left: Mode Icon & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <motion.div
            key={calendarMode}
            initial={{ scale: 0.8, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold shadow-sm transition-colors ${
              calendarMode === 'schedule'
                ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
                : 'bg-amber-500 text-white shadow-amber-200 dark:shadow-none'
            }`}
          >
            {calendarMode === 'schedule' ? (
              <CalendarIcon className="w-5 h-5" />
            ) : (
              <Utensils className="w-5 h-5" />
            )}
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {year}년 {month + 1}월
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                  calendarMode === 'schedule'
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                    : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                {calendarMode === 'schedule' ? '📅 학급 일정 달력' : '🍱 월간 급식 달력'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {calendarMode === 'schedule'
                ? '기간 지정 일정은 달력에 가로 바로 연결되어 표시됩니다.'
                : '날짜를 클릭하면 해당 일자의 상세 급식 메뉴와 칼로리를 확인합니다.'}
            </p>
          </div>
        </div>

        {/* Right: Switch Mode Buttons with layoutId Pill & Month Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
          
          {/* Mode Switcher Pill with motion.dev layoutId */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700 relative">
            <button
              type="button"
              onClick={() => setCalendarMode('schedule')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calendarMode === 'schedule' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {calendarMode === 'schedule' && (
                <motion.div
                  layoutId="calendarModePill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <CalendarIcon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">일정 달력</span>
            </button>

            <button
              type="button"
              onClick={() => setCalendarMode('meal')}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calendarMode === 'meal' ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {calendarMode === 'meal' && (
                <motion.div
                  layoutId="calendarModePill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Utensils className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">급식 달력</span>
            </button>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              오늘
            </motion.button>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <span className="px-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {month + 1}월
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Monitor Add Schedule Button */}
            {calendarMode === 'schedule' && isMonitor && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => onAddSchedule?.(formatDateStr(new Date(year, month, 1)))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all ml-1"
                title="새 학급 일정 등록"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>일정 추가</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <motion.div
        layout
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden p-3 sm:p-4 transition-colors"
      >
        {/* Day Names Row */}
        <div className="grid grid-cols-7 text-center font-extrabold text-xs text-slate-500 dark:text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-rose-600">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-600">토</span>
        </div>

        {/* Date Cells Grid - Grouped by Weeks for continuous multi-day span */}
        <div className="space-y-1 sm:space-y-1.5">
          {weeks.map((week, wIdx) => {
            const { tracks } = getWeekTrackLayout(week);

            return (
              <div key={`week-${wIdx}`} className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {week.map((cell, dayIdx) => {
                  const dayNotices = noticesByDate[cell.dateStr] || [];
                  const dayMeal = monthlyMeals[cell.dateStr];
                  const isSunday = cell.date.getDay() === 0;
                  const isSaturday = cell.date.getDay() === 6;
                  const isWeekend = isSunday || isSaturday;
                  const hasHoliday = dayNotices.some((n) => n.isHoliday);

                  const hasContent =
                    calendarMode === 'schedule'
                      ? dayNotices.length > 0
                      : dayMeal && dayMeal.dishes && dayMeal.dishes.length > 0;

                  const track0Notice = tracks[0] ? tracks[0][dayIdx] : null;
                  const track1Notice = tracks[1] ? tracks[1][dayIdx] : null;
                  const trackCountOnDay = (track0Notice ? 1 : 0) + (track1Notice ? 1 : 0);
                  const extraCount = Math.max(0, dayNotices.length - trackCountOnDay);

                  return (
                    <div
                      key={`cell-${cell.dateStr}-${dayIdx}`}
                      onClick={() => handleCellClick(cell)}
                      className={`min-h-[56px] sm:min-h-[110px] p-1 sm:p-1.5 rounded-xl border transition-all flex flex-col justify-between relative cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/40 border-slate-100 opacity-30'
                          : cell.dateStr === selectedDateStr
                          ? calendarMode === 'schedule'
                            ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/40 z-10 shadow-sm'
                            : 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/40 z-10 shadow-sm'
                          : cell.isToday
                          ? calendarMode === 'schedule'
                            ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400'
                            : 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400'
                          : hasHoliday
                          ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40'
                          : isWeekend
                          ? 'bg-slate-50/60 dark:bg-slate-850/60 border-slate-100 dark:border-slate-800'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Cell Header: Date Number & Badges */}
                      <div className="flex items-center justify-between pointer-events-none">
                        <span
                          className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                            cell.dateStr === selectedDateStr
                              ? calendarMode === 'schedule'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-amber-500 text-white shadow-sm'
                              : cell.isToday
                              ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                              : hasHoliday
                              ? 'text-rose-600 font-black'
                              : isSunday
                              ? 'text-rose-600'
                              : isSaturday
                              ? 'text-blue-600 dark:text-blue-400'
                              : cell.isCurrentMonth
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {calendarMode === 'schedule' && hasHoliday && cell.isCurrentMonth && (
                          <span className="text-[8px] sm:text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1 rounded border border-rose-100">
                            휴업
                          </span>
                        )}

                        {calendarMode === 'schedule' && dayNotices.length > 0 && !hasHoliday && (
                          <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 hidden sm:inline">
                            {dayNotices.length}
                          </span>
                        )}

                        {calendarMode === 'schedule' && isMonitor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddSchedule?.(cell.dateStr);
                            }}
                            title={`${cell.dateStr} 새 일정 등록`}
                            className="w-4 h-4 rounded hidden sm:flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-100/70 transition-colors ml-auto pointer-events-auto"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}

                        {calendarMode === 'meal' && cell.isCurrentMonth && !isWeekend && dayMeal && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded hidden sm:inline">
                            🍱
                          </span>
                        )}
                      </div>

                      {/* Mobile Indicator Dots (sm:hidden) */}
                      {calendarMode === 'schedule' ? (
                        <div className="flex sm:hidden items-center justify-center gap-1 my-auto flex-wrap min-h-[14px] pointer-events-none">
                          {dayNotices.slice(0, 3).map((n, idx) => {
                            const cat = CATEGORY_STYLES[n.category] || CATEGORY_STYLES.기타;
                            return (
                              <span
                                key={`dot-${n.id}-${idx}`}
                                className={`w-1.5 h-1.5 rounded-full ${cat.dot || 'bg-blue-500'} ring-1 ring-white`}
                              />
                            );
                          })}
                          {dayNotices.length > 3 && (
                            <span className="text-[8px] font-black text-slate-400 leading-none">
                              +{dayNotices.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex sm:hidden items-center justify-center my-auto min-h-[14px] pointer-events-none">
                          {cell.isCurrentMonth && !isWeekend && dayMeal && dayMeal.dishes?.length > 0 ? (
                            <span className="text-[10px] leading-none">🍱</span>
                          ) : null}
                        </div>
                      )}

                      {/* Desktop Cell Body (Hidden on mobile, visible on sm+) */}
                      <div className="hidden sm:flex flex-col flex-1 justify-between">
                        <AnimatePresence mode="wait">
                          {calendarMode === 'schedule' ? (
                            <motion.div
                              key="schedule-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-1 my-1 flex-1 flex flex-col justify-start"
                            >
                              {[0, 1].map((tIdx) => {
                                const notice = tIdx === 0 ? track0Notice : track1Notice;
                                if (!notice) {
                                  if (tIdx === 0 && track1Notice) {
                                    return <div key={`spacer-${tIdx}`} className="h-5 invisible pointer-events-none" />;
                                  }
                                  return null;
                                }

                                const isMulti = isNoticeMultiDay(notice);
                                const cat = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.기타;

                                if (isMulti) {
                                  const isStartOfSpan =
                                    dayIdx === 0 ||
                                    !tracks[tIdx][dayIdx - 1] ||
                                    tracks[tIdx][dayIdx - 1].id !== notice.id ||
                                    cell.dateStr === notice.startDate;

                                  const isEndOfSpan =
                                    dayIdx === 6 ||
                                    !tracks[tIdx][dayIdx + 1] ||
                                    tracks[tIdx][dayIdx + 1].id !== notice.id ||
                                    cell.dateStr === notice.endDate;

                                  const spanClass =
                                    isStartOfSpan && isEndOfSpan
                                      ? 'rounded-md mx-0.5'
                                      : isStartOfSpan && !isEndOfSpan
                                      ? 'rounded-l-md rounded-r-none -mr-2 sm:-mr-2.5 z-10'
                                      : !isStartOfSpan && isEndOfSpan
                                      ? 'rounded-r-md rounded-l-none -ml-2 sm:-ml-2.5 z-10'
                                      : 'rounded-none -mx-2 sm:-mx-2.5 z-10';

                                  return (
                                    <div
                                      key={`track-${tIdx}-${notice.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (notice.isSchoolEvent) {
                                          setSelectedDayNotices({
                                            dateStr: cell.dateStr,
                                            dayNum: cell.dayNum,
                                            notices: dayNotices
                                          });
                                        } else {
                                          onSelectNotice && onSelectNotice(notice);
                                        }
                                      }}
                                      className={`h-5 flex items-center transition-all cursor-pointer select-none overflow-hidden ${cat.barBg || 'bg-blue-500 text-white'} ${spanClass}`}
                                      title={`${notice.title} (${notice.startDate} ~ ${notice.endDate})`}
                                    >
                                      {isStartOfSpan ? (
                                        <div className="flex items-center gap-1 px-1.5 text-[10px] font-extrabold truncate leading-none">
                                          <span className="text-[9px] opacity-90">
                                            {notice.isSchoolEvent ? '🏫' : '📌'}
                                          </span>
                                          <span className="truncate">{notice.title}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center px-1 text-[9px] font-medium text-white/90 truncate leading-none">
                                          <span className="truncate hidden sm:inline">{notice.title}</span>
                                          <span className="sm:hidden text-[7px] opacity-70">➔</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                // Single Day Event
                                return (
                                  <div
                                    key={`track-${tIdx}-${notice.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (notice.isSchoolEvent) {
                                        setSelectedDayNotices({
                                          dateStr: cell.dateStr,
                                          dayNum: cell.dayNum,
                                          notices: dayNotices
                                        });
                                      } else {
                                        onSelectNotice && onSelectNotice(notice);
                                      }
                                    }}
                                    className={`h-5 px-1.5 rounded-md font-extrabold truncate border text-[10px] flex items-center gap-1 transition-all mx-0.5 ${cat.bg} ${cat.text} ${cat.border} hover:opacity-90 cursor-pointer`}
                                    title={notice.title}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} flex-shrink-0`} />
                                    <span className="truncate">
                                      {notice.isSchoolEvent ? `🏫 ${notice.title}` : notice.title}
                                    </span>
                                  </div>
                                );
                              })}

                              {extraCount > 0 && (
                                <span className="text-[9px] font-extrabold text-blue-600 pl-1 block">
                                  +{extraCount}개 더보기
                                </span>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="meal-content"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="my-1 overflow-hidden flex-1 flex flex-col justify-between"
                            >
                              {cell.isCurrentMonth && !isWeekend && dayMeal && dayMeal.dishes ? (
                                <div className="space-y-0.5">
                                  {getMealHighlights(dayMeal.dishes).map((dish, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="text-[10px] text-slate-700 font-semibold truncate leading-tight flex items-center gap-1"
                                      title={dish}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                      <span className="truncate">{dish}</span>
                                    </div>
                                  ))}
                                  {dayMeal.dishes.length > 2 && (
                                    <div className="text-[9px] text-amber-700/80 font-bold pl-2.5">
                                      외 {dayMeal.dishes.length - 2}개
                                    </div>
                                  )}
                                </div>
                              ) : isWeekend && cell.isCurrentMonth ? (
                                <div className="text-[10px] text-slate-400 italic text-center pt-2">
                                  주말
                                </div>
                              ) : null}

                              {dayMeal?.calInfo && cell.isCurrentMonth && !isWeekend && (
                                <div className="text-[9px] text-slate-400 font-semibold text-right">
                                  {dayMeal.calInfo.replace('Kcal', 'kcal')}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Calendar Legend for Schedule Mode */}
        {calendarMode === 'schedule' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-3 flex-wrap font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" />
                <span className="text-purple-700">학교 학사일정 (나이스 연동)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-rose-600">수행평가</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-blue-600">학교행사</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-600">외부활동</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              * 날짜를 클릭하면 해당 일자의 상세 일정을 확인합니다.
            </div>
          </div>
        )}
      </motion.div>

      {/* Selected Day Agenda Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
                calendarMode === 'schedule' ? 'bg-blue-600 shadow-blue-200 dark:shadow-none' : 'bg-amber-500 shadow-amber-200 dark:shadow-none'
              }`}
            >
              {calendarMode === 'schedule' ? <CalendarIcon className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>{selectedDateFormattedText} 일정</span>
                {isSameDate(new Date(selectedDateStr + 'T00:00:00'), new Date()) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    오늘
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {calendarMode === 'schedule'
                  ? `총 ${selectedNotices.length}건의 안내 및 행사`
                  : '선택일 급식 안내'}
              </p>
            </div>
          </div>

          {calendarMode === 'schedule' && isMonitor && (
            <button
              type="button"
              onClick={() => onAddSchedule?.(selectedDateStr)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">이 날짜에</span>
              <span>일정 등록</span>
            </button>
          )}
        </div>

        {/* Agenda Content */}
        {calendarMode === 'schedule' ? (
          selectedNotices.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                {selectedDateFormattedText}에 등록된 일정이 없습니다.
              </p>
              {isMonitor && (
                <button
                  type="button"
                  onClick={() => onAddSchedule?.(selectedDateStr)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 일정 추가하기</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {selectedNotices.map((n) => {
                const cat = CATEGORY_STYLES[n.category] || CATEGORY_STYLES.기타;
                const dday = calculateDDay(n);

                if (n.isSchoolEvent) {
                  return (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1.5">
                          <span>🏫 부광고 학사일정</span>
                          {n.isHoliday && (
                            <span className="text-rose-600 font-extrabold bg-rose-50 px-1 rounded border border-rose-200">
                              휴업일
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 font-mono">
                          {n.dateType === 'range' ? `${n.startDate} ~ ${n.endDate}` : n.date}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                        <span>{n.title}</span>
                        {n.isExam && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-black shadow-sm">
                            지필평가
                          </span>
                        )}
                      </h4>
                      {n.content && (
                        <p className="text-xs text-purple-900/85 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-purple-100">
                          {n.content}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={n.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectNotice && onSelectNotice(n)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-slate-800/80 transition-all cursor-pointer space-y-2 group bg-white dark:bg-slate-850 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          {n.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {n.dateType === 'range' ? `${n.startDate} ~ ${n.endDate}` : n.date}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dday.text === 'D-DAY'
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-black animate-pulse'
                            : dday.text === '진행 중'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {dday.text}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {n.title}
                    </h4>
                    {n.content && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.content}
                      </p>
                    )}
                    <div className="flex items-center justify-end text-[11px] text-blue-600 font-bold pt-0.5">
                      <span className="flex items-center gap-1 group-hover:underline">
                        <Eye className="w-3.5 h-3.5" /> 상세 보기
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* Meal View for Selected Date */
          selectedMeal && selectedMeal.dishes && selectedMeal.dishes.length > 0 ? (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🍱 점심 급식 식단</span>
                </span>
                {selectedMeal.calInfo && (
                  <span className="text-xs font-bold text-amber-700 font-mono bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    🔥 {selectedMeal.calInfo}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-amber-100">
                {selectedMeal.dishes.map((dish, i) => (
                  <div key={i} className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{dish}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              해당 일자의 급식 정보가 없거나 주말/휴업일입니다.
            </div>
          )
        )}
      </div>

      {/* SCHEDULE DETAIL MODAL with AnimatePresence */}
      <AnimatePresence>
        {selectedDayNotices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedDayNotices(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      {selectedDayNotices.dateStr} 일정 및 학사안내
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      총 {selectedDayNotices.notices.length}건의 안내 및 행사
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isMonitor && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetDate = selectedDayNotices.dateStr;
                        setSelectedDayNotices(null);
                        onAddSchedule?.(targetDate);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>일정 등록</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDayNotices(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {selectedDayNotices.notices.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {selectedDayNotices.dateStr}에 등록된 일정이 없습니다.
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {isMonitor
                          ? '반장 권한으로 이 날짜에 새 학급 일정이나 안내를 등록할 수 있습니다.'
                          : '새로운 학급 소식이 등록되면 여기에 표시됩니다.'}
                      </p>
                    </div>
                    {isMonitor ? (
                      <button
                        type="button"
                        onClick={() => {
                          const targetDate = selectedDayNotices.dateStr;
                          setSelectedDayNotices(null);
                          onAddSchedule?.(targetDate);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>이 날짜에 새 일정 등록하기</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayNotices(null);
                          onOpenPinModal?.();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                      >
                        <span>반장 인증 후 일정 등록</span>
                      </button>
                    )}
                  </div>
                ) : (
                  selectedDayNotices.notices.map((n) => {
                    const cat = CATEGORY_STYLES[n.category] || CATEGORY_STYLES.기타;
                    const dday = calculateDDay(n);

                    if (n.isSchoolEvent) {
                      return (
                        <div
                          key={n.id}
                          className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1.5">
                              <span>🏫 부광고 학사일정</span>
                              {n.isHoliday && (
                                <span className="text-rose-600 font-extrabold bg-rose-50 px-1 rounded border border-rose-200">
                                  휴업일
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-purple-700 font-mono">
                              {n.dateType === 'range' ? `${n.startDate} ~ ${n.endDate}` : n.date}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                            <span>{n.title}</span>
                            {n.isExam && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-black shadow-sm">
                                지필평가
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-purple-900/85 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-purple-100">
                            {n.content}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-purple-500 font-medium pt-0.5">
                            <span>🏛️ 인천광역시교육청 나이스(NEIS) 연동</span>
                            <span className="font-bold text-purple-700">공식 학사일정</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <motion.div
                        key={n.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedDayNotices(null);
                          onSelectNotice && onSelectNotice(n);
                        }}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-colors cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}
                          >
                            {n.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {dday.text}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                          {n.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                        <div className="flex items-center justify-end text-[11px] text-slate-400 pt-1">
                          <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:underline">
                            <Eye className="w-3 h-3" /> 상세 보기
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}

                {/* Additional Add Button at bottom if notices exist and isMonitor */}
                {isMonitor && selectedDayNotices.notices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetDate = selectedDayNotices.dateStr;
                      setSelectedDayNotices(null);
                      onAddSchedule?.(targetDate);
                    }}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>이 날짜에 다른 일정 추가 등록</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEAL DETAIL MODAL with AnimatePresence */}
      <AnimatePresence>
        {selectedDayMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedDayMeal(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-none">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      {selectedDayMeal.dateStr} 오늘의 급식
                    </h3>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      부광고등학교 {selectedDayMeal.meal.type || '중식'} 식단표
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDayMeal(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu List */}
              <div className="bg-amber-50/50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-100/80 dark:border-amber-900/40 space-y-2.5">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>식단 구성 메뉴</span>
                </div>
                <ul className="space-y-1.5 pt-1">
                  {selectedDayMeal.meal.dishes.map((dish, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-amber-100/60 dark:border-slate-700 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <span>{cleanDishName(dish)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {dish.match(/\([0-9.]+\)/)?.[0] || ''}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Nutritional & Calories Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-500" /> 총 칼로리
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {selectedDayMeal.meal.calInfo || '정보 없음'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-500" /> 알레르기 안내
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
                    식단 옆 괄호 번호 참고
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDayMeal(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                닫기
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
