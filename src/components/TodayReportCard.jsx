import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Utensils,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Sun,
  Coffee
} from 'lucide-react';
import { getSchoolInfoForToday, parseMealDishes, cleanDishName } from '../services/schoolService';
import { calculateDDay, getLocalDateString } from '../services/storageService';

export default function TodayReportCard({ notices = [], onNavigate, onSelectNotice }) {
  const [loading, setLoading] = useState(true);
  const [todayMeal, setTodayMeal] = useState([]);
  const [todayTimetable, setTodayTimetable] = useState([]);
  
  const today = new Date();
  const dayIndex = today.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const dayName = dayNames[dayIndex];

  useEffect(() => {
    let isMounted = true;
    async function loadTodaySchoolData() {
      try {
        const data = await getSchoolInfoForToday();
        if (isMounted) {
          setTodayMeal(parseMealDishes(data.meal || []));
          setTodayTimetable(data.timetable || []);
        }
      } catch (e) {
        console.warn('Today school data fetch failed', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTodaySchoolData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate Urgent / Today Deadlines from Notices
  const todayDateStr = getLocalDateString(today);

  const urgentNotices = useMemo(() => {
    return notices
      .map((n) => ({ notice: n, dday: calculateDDay(n) }))
      .filter(({ dday }) => !dday.isExpired && dday.days <= 3)
      .sort((a, b) => a.dday.days - b.dday.days);
  }, [notices]);

  // Notices spanning or occurring today
  const todayEvents = useMemo(() => {
    return notices.filter((n) => {
      if (n.dateType === 'range' && n.startDate && n.endDate) {
        return todayDateStr >= n.startDate && todayDateStr <= n.endDate;
      }
      return n.date === todayDateStr;
    });
  }, [notices, todayDateStr]);

  const topUrgent = urgentNotices[0];

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 border border-blue-100/90 shadow-sm p-5 sm:p-7 relative overflow-hidden space-y-5">
      {/* Background soft glow decoration */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
      <div className="absolute right-20 -bottom-10 w-36 h-36 rounded-full bg-indigo-200/25 blur-2xl pointer-events-none" />

      {/* 1. Header: Date + Title + Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>오늘 하루 리포트</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">부광고 2학년 1반</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{month}월 {date}일 ({dayName}요일)</span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">
              {isWeekend ? '주말 휴일' : '수업일'}
            </span>
          </h2>
        </div>

        {/* Action Button: Go to full calendar / schedule */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.('calendar', 'monthCalendar')}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all shadow-sm flex items-center gap-1"
          >
            <span>달력 보기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Urgent / Highlight Alert Banner */}
      <div className="relative z-10">
        {topUrgent ? (
          <div
            onClick={() => onSelectNotice?.(topUrgent.notice)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-black shadow-sm">
                {topUrgent.dday.days === 0 ? 'D-DAY' : `D-${topUrgent.dday.days}`}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>
                    {topUrgent.dday.days === 0
                      ? '오늘 마감되는 중요 과제/공지가 있습니다!'
                      : `${topUrgent.dday.days}일 후 마감 임박!`}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 group-hover:text-rose-600 truncate transition-colors">
                  {topUrgent.notice.title}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-600 whitespace-nowrap flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
              <span>자세히 보기</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        ) : todayEvents.length > 0 ? (
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-2.5 text-xs text-blue-900 font-bold">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>오늘의 일정: <strong>{todayEvents.map((e) => e.title).join(', ')}</strong></span>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>오늘 긴급하게 마감되는 과제가 없습니다. 여유롭고 알찬 하루 되세요! ✨</span>
          </div>
        )}
      </div>

      {/* 3. Two Mini Cards: [오늘의 급식] & [오늘의 시간표] */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
        {/* Card A: 오늘의 급식 식단 */}
        <div
          onClick={() => onNavigate?.('calendar', 'schedule')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-800 text-xs">오늘의 점심 급식</span>
            </div>
            <span className="text-[10px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
              <span>전체 식단</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {isWeekend ? (
            <div className="py-2.5 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 font-medium">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>주말에는 급식이 제공되지 않습니다.</span>
            </div>
          ) : todayMeal.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {todayMeal.slice(0, 5).map((dish, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-950 font-bold text-[11px]"
                >
                  {cleanDishName(dish)}
                </span>
              ))}
              {todayMeal.length > 5 && (
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 font-bold text-[10px]">
                  +{todayMeal.length - 5}
                </span>
              )}
            </div>
          ) : (
            <div className="py-2.5 text-center text-slate-400 text-xs font-medium">
              {loading ? '급식 정보를 불러오는 중...' : '오늘 등록된 급식 메뉴가 없습니다.'}
            </div>
          )}
        </div>

        {/* Card B: 오늘의 시간표 */}
        <div
          onClick={() => onNavigate?.('calendar', 'schedule')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-800 text-xs">오늘의 수업 시간표</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 group-hover:underline flex items-center gap-0.5">
              <span>시간표 전체</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {isWeekend ? (
            <div className="py-2.5 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5 font-medium">
              <Coffee className="w-4 h-4 text-indigo-400" />
              <span>주말 수업 없음 (재충전의 시간 🌿)</span>
            </div>
          ) : todayTimetable.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
              {todayTimetable.map((item, idx) => {
                const subjectName = typeof item === 'object' && item !== null ? item.subject || item.name || '' : String(item || '');
                const periodNum = typeof item === 'object' && item !== null && item.period ? item.period : idx + 1;
                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[42px] px-1 py-1 rounded-lg bg-indigo-50/70 border border-indigo-100/80 text-center"
                  >
                    <span className="block text-[9px] font-extrabold text-indigo-400">
                      {periodNum}
                    </span>
                    <span className="block text-[11px] font-black text-indigo-950 truncate" title={subjectName}>
                      {subjectName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-2.5 text-center text-slate-400 text-xs font-medium">
              {loading ? '시간표 정보를 불러오는 중...' : '오늘 등록된 시간표 정보가 없습니다.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
