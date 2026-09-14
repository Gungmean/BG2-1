// src/components/ScheduleInfo.jsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Calendar, BookOpen, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { getWeekDays, getSchoolInfoForDate, parseMealDishes, cleanDishName, PERIOD_SCHEDULE, SCHOOL_ROUTINE_TIMES } from '../services/schoolService';

export default function ScheduleInfo() {
  const weekDays = useState(() => getWeekDays())[0];
  
  // 기본 선택 요일: 오늘(Today)이 주중에 있으면 오늘, 아니면 월요일
  const defaultDay = weekDays.find(d => d.isToday) || weekDays[0];
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState(null);

  // 로컬 캐시 (요일 클릭 시 재요청 없이 즉각 부드럽게 전환)
  const cacheRef = useRef({});

  const loadDataForDay = async (dayObj, forceRefresh = false) => {
    if (!forceRefresh && cacheRef.current[dayObj.ymd]) {
      const cached = cacheRef.current[dayObj.ymd];
      setMeal(cached.meal);
      setTimetable(cached.timetable);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getSchoolInfoForDate(dayObj.ymd);
      cacheRef.current[dayObj.ymd] = data;
      setMeal(data.meal);
      setTimetable(data.timetable);
    } catch (e) {
      console.error(e);
      setError('학교 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataForDay(selectedDay);
  }, [selectedDay]);

  const parsedDishes = parseMealDishes(meal);

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold mb-1">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>부광고등학교 2학년 1반</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold">주간 시간표 및 급식 식단표</h2>
          <p className="text-xs text-blue-100 mt-1">
            월요일부터 금요일까지 요일을 선택하여 해당 일자의 급식과 수업 시간표를 확인하세요.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={() => loadDataForDay(selectedDay, true)}
          disabled={loading}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 transition-all text-white active:scale-95 border border-white/20"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Weekday Selector Tabs (월~금) with Sliding White Pill Motion */}
      <div className="bg-slate-100/90 p-1.5 rounded-full border border-slate-200/90 shadow-inner">
        <div className="grid grid-cols-5 gap-1 relative">
          {weekDays.map((day) => {
            const isSelected = selectedDay.ymd === day.ymd;
            return (
              <motion.button
                key={day.ymd}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDay(day)}
                className={`relative py-2.5 px-2 rounded-full flex flex-col items-center justify-center transition-colors z-10 ${
                  isSelected
                    ? 'text-blue-600 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                {/* 🤍 하얀색이 왔다갔다 슬라이딩하는 Active Pill */}
                {isSelected && (
                  <motion.div
                    layoutId="weekdayActivePill"
                    className="absolute inset-0 bg-white rounded-full shadow-md shadow-slate-300/60 border border-slate-200/60"
                    transition={{
                      type: 'spring',
                      stiffness: 480,
                      damping: 32
                    }}
                  />
                )}

                {/* Today Badge */}
                {day.isToday && (
                  <span
                    className={`relative z-10 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mb-0.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    오늘
                  </span>
                )}
                <span className="relative z-10 text-xs sm:text-sm font-extrabold">
                  {day.dayName}요일
                </span>
                <span
                  className={`relative z-10 text-[10px] mt-0.5 transition-colors ${
                    isSelected ? 'text-blue-500 font-bold' : 'text-slate-400'
                  }`}
                >
                  {day.displayDate}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Data Section with Smooth Animated Content Transition */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-blue-600 border-t-transparent mb-3"></div>
            <p className="text-xs font-semibold text-slate-600">
              {selectedDay.dayName}요일({selectedDay.displayDate}) 급식 및 시간표 정보를 불러오는 중...
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-red-50 rounded-3xl border border-red-200 text-center text-red-700 space-y-2"
          >
            <AlertCircle className="w-7 h-7 mx-auto text-red-500" />
            <p className="font-bold text-sm">{error}</p>
            <button
              onClick={() => loadDataForDay(selectedDay, true)}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-all mt-2"
            >
              다시 시도
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={selectedDay.ymd}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* 급식 Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {selectedDay.dayName}요일 급식
                      </h3>
                      <p className="text-xs text-slate-500">
                        부광고 식단 ({selectedDay.displayDate})
                      </p>
                    </div>
                  </div>

                  {selectedDay.isToday && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> 오늘 식단
                    </span>
                  )}
                </div>

                {parsedDishes.length > 0 && parsedDishes[0] !== '급식 정보가 없습니다.' ? (
                  <ul className="space-y-2">
                    {parsedDishes.map((dish, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm font-medium bg-slate-50/70 px-3 py-2 rounded-xl border border-slate-100"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="font-semibold text-slate-800">{cleanDishName(dish)}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-auto">
                          {dish.match(/\([0-9.]+\)/)?.[0] || ''}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                    {selectedDay.dayName}요일({selectedDay.displayDate}) 등록된 급식 정보가 없습니다.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                * 알레르기 유발물질 번호 포함 (NEIS 연동)
              </div>
            </div>

            {/* 시간표 Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {selectedDay.dayName}요일 시간표
                      </h3>
                      <p className="text-xs text-slate-500">
                        2학년 1반 ({selectedDay.displayDate})
                      </p>
                    </div>
                  </div>

                  {selectedDay.isToday && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      오늘 시간표
                    </span>
                  )}
                </div>

                {timetable && timetable.length > 0 ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold">
                          <tr>
                            <th className="px-3.5 py-2.5">교시</th>
                            <th className="px-3.5 py-2.5">수업 시간</th>
                            <th className="px-3.5 py-2.5">수업 과목</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {timetable.map((item, idx) => {
                            const timeStr = item.time || PERIOD_SCHEDULE[String(item.period)]?.time || '-';
                            return (
                              <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                <td className="px-3.5 py-2.5 font-bold text-blue-600 whitespace-nowrap">
                                  {item.period}교시
                                </td>
                                <td className="px-3.5 py-2.5 font-medium text-slate-500 text-xs whitespace-nowrap font-mono tabular-nums">
                                  {timeStr}
                                </td>
                                <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                                  {item.subject}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 부광고 주요 일과 시정표 안내 */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">🍱 점심시간</span>
                        <span className="font-bold text-slate-700 font-mono text-[11px]">12:40 ~ 13:40</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">🧹 청소시간</span>
                        <span className="font-bold text-slate-700 font-mono text-[11px]">15:30 ~ 15:45</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">🔔 종례</span>
                        <span className="font-bold text-slate-700 font-mono text-[11px]">16:35 ~ 16:40</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                    {selectedDay.dayName}요일({selectedDay.displayDate}) 설정된 시간표가 없습니다.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                * 학교 사정에 의해 시간표가 변경될 수 있습니다.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
