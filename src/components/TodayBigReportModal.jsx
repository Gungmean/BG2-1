import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Utensils,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  X,
  Maximize2,
  Minimize2,
  Flame,
  Info,
  Sun,
  Coffee
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { PERIOD_SCHEDULE, getCurrentPeriod, cleanDishName } from '../services/schoolService';
import { calculateDDay } from '../services/storageService';

export default function TodayBigReportModal({
  isOpen,
  onClose,
  todayData,
  tomorrowData,
  initialTab = 'today',
  notices = [],
  onSelectNotice,
  onNavigate
}) {
  const [dayTab, setDayTab] = useState(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [currentPeriod, setCurrentPeriod] = useState(() => getCurrentPeriod());
  const modalContainerRef = useRef(null);

  // 모달 열릴 때 탭 동기화
  useEffect(() => {
    if (isOpen) {
      setDayTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 1초마다 시계 업데이트
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCurrentPeriod(getCurrentPeriod());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const today = new Date();
  const targetDate = dayTab === 'today' ? today : addDays(today, 1);
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');
  const dayIndex = targetDate.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getMonth() + 1;
  const date = targetDate.getDate();
  const dayName = dayNames[dayIndex];
  const year = targetDate.getFullYear();

  const activeData = dayTab === 'today' ? todayData : tomorrowData;
  const mealDishes = activeData?.meal || [];
  const timetableList = activeData?.timetable || [];

  // 선택된 날짜 기준 마감 및 수행평가 계산 (훅 순서 보장을 위해 early return 이전에 위치)
  const targetDateDueNotices = useMemo(() => {
    if (!isOpen) return [];
    return (notices || [])
      .filter((n) => n.category === '수행평가' && n.dateType !== 'none' && Boolean(n.date || n.startDate || n.endDate))
      .map((n) => ({ notice: n, dday: calculateDDay(n, targetDate) }))
      .filter(({ notice, dday }) => {
        if (dday.isExpired) return false;
        if (notice.date === targetDateStr) return true;
        if (notice.dateType === 'range' && notice.startDate && notice.endDate) {
          return targetDateStr >= notice.startDate && targetDateStr <= notice.endDate;
        }
        if (dday.days === 0) return true;
        return false;
      });
  }, [isOpen, notices, targetDateStr, targetDate]);

  const upcomingD7Notices = useMemo(() => {
    if (!isOpen) return [];
    const dueIds = new Set(targetDateDueNotices.map((item) => item.notice.id));
    return (notices || [])
      .filter(
        (n) =>
          n.category === '수행평가' &&
          n.dateType !== 'none' &&
          Boolean(n.date || n.startDate || n.endDate) &&
          !dueIds.has(n.id)
      )
      .map((n) => ({ notice: n, dday: calculateDDay(n, targetDate) }))
      .filter(({ dday }) => !dday.isExpired && dday.days >= 1 && dday.days <= 7)
      .sort((a, b) => a.dday.days - b.dday.days);
  }, [isOpen, notices, targetDateDueNotices, targetDate]);

  if (!isOpen) return null;

  // 전체화면 토글
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (modalContainerRef.current?.requestFullscreen) {
          await modalContainerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('전체화면 전환 실패:', err);
    }
  };

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl my-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 rounded-3xl sm:rounded-[32px] border border-slate-200 dark:border-slate-750 shadow-2xl overflow-hidden flex flex-col max-h-[96vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: 헤더 영역 */}
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] sm:text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-900/60">
                  부광고 2학년 1반
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {year}학년도 1학기
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{month}월 {date}일 ({dayName}요일)</span>
                <span
                  className={`text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-lg ${
                    isWeekend
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {isWeekend ? '주말 휴일' : '수업일'}
                </span>
              </h1>
            </div>
          </div>

          {/* 중앙: 오늘 / 내일 전환 탭 */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setDayTab('today')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  dayTab === 'today'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                오늘 하루
              </button>
              <button
                type="button"
                onClick={() => setDayTab('tomorrow')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  dayTab === 'tomorrow'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                내일 예보
              </button>
            </div>
          </div>

          {/* 우측: 실시간 디지털 시계 & 전체화면 & 닫기 버튼 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex flex-col items-end pr-2 border-r border-slate-200 dark:border-slate-800 font-mono">
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-wider">
                {format(currentTime, 'HH:mm:ss')}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-semibold">
                실시간 시계
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title={isFullscreen ? '전체화면 종료' : '전체화면으로 보기'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">창모드</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">전체화면</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="닫기 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY: 스크롤 가능한 대형 브리핑 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 3-COLUMN MAIN DASHBOARD GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUMN 1 (5 cols): 🍱 오늘의 점심 급식 식단표 */}
            <div className="lg:col-span-5 flex flex-col rounded-3xl bg-white dark:bg-slate-850 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-750 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-300 dark:shadow-none">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                      {dayTab === 'today' ? '오늘의' : '내일의'} 점심 급식
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      부광고등학교 중식 식단표
                    </p>
                  </div>
                </div>
                {activeData?.calInfo && (
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono bg-amber-50 dark:bg-amber-950/70 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>{activeData.calInfo}</span>
                  </span>
                )}
              </div>

              {isWeekend ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                  <Sun className="w-8 h-8 text-amber-400" />
                  <span className="font-bold">주말에는 급식이 제공되지 않습니다.</span>
                  <span className="text-xs">집에서 맛있는 식사와 함께 푹 쉬세요! 🌿</span>
                </div>
              ) : mealDishes.length > 0 ? (
                <div className="space-y-2 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mealDishes.map((dish, i) => (
                      <div
                        key={i}
                        className="p-3 sm:p-3.5 rounded-xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-100/90 dark:border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:scale-[1.01] transition-transform"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{cleanDishName(dish)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-500" />
                      <span>인천광역시교육청 나이스(NEIS) 연동 식단 정보입니다.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate?.('calendar', 'mealCalendar');
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>월간 식단표</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
                  등록된 급식 메뉴 정보가 없습니다.
                </div>
              )}
            </div>

            {/* COLUMN 2 (7 cols): 📚 수업 시간표 (큰 표와 현재 수업 표시) */}
            <div className="lg:col-span-7 flex flex-col rounded-3xl bg-white dark:bg-slate-850 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-750 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-750">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-300 dark:shadow-none">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                      {dayTab === 'today' ? '오늘의' : '내일의'} 수업 시간표
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      부광고 2학년 1반 정규 시정표 (1~7교시)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate?.('schedule');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>주간 시간표</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isWeekend ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                  <Coffee className="w-8 h-8 text-indigo-400" />
                  <span className="font-bold">주말 수업 없음 (재충전의 시간 🌿)</span>
                  <span className="text-xs">다음 주 월요일 시간표를 미리 확인해보세요.</span>
                </div>
              ) : timetableList.length > 0 ? (
                <div className="flex-1">
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                    {timetableList.map((item, idx) => {
                      const subjectName =
                        typeof item === 'object' && item !== null
                          ? item.subject || item.name || ''
                          : String(item || '');
                      const periodNum =
                        typeof item === 'object' && item !== null && item.period
                          ? item.period
                          : idx + 1;
                      const timeInfo = PERIOD_SCHEDULE[String(periodNum)];
                      const timeStr =
                        (typeof item === 'object' && item !== null && item.time) ||
                        timeInfo?.time ||
                        '';
                      const startTime =
                        (typeof item === 'object' && item !== null && item.startTime) ||
                        timeInfo?.start ||
                        '';
                      const endTime =
                        (typeof item === 'object' && item !== null && item.endTime) ||
                        timeInfo?.end ||
                        '';

                      const isCurrent =
                        dayTab === 'today' &&
                        currentPeriod !== null &&
                        Number(periodNum) === currentPeriod;

                      return (
                        <div
                          key={`period-${periodNum}`}
                          className={`p-2 sm:p-3 rounded-2xl text-center flex flex-col justify-between transition-all relative ${
                            isCurrent
                              ? 'bg-gradient-to-b from-indigo-50 to-blue-100/90 dark:from-indigo-950/90 dark:to-blue-900/60 border-2 border-indigo-500 dark:border-indigo-400 shadow-md ring-2 ring-indigo-400/30'
                              : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60'
                          }`}
                        >
                          {isCurrent && (
                            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-600 text-white shadow-xs animate-pulse">
                              수업 중
                            </span>
                          )}
                          <div>
                            <span
                              className={`block text-[11px] sm:text-xs font-black ${
                                isCurrent
                                  ? 'text-indigo-700 dark:text-indigo-300'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {periodNum}교시
                            </span>
                            <div className="my-1.5 min-h-[2.5rem] flex items-center justify-center">
                              <span
                                className={`text-xs sm:text-sm md:text-base font-black tracking-tight leading-tight break-keep line-clamp-2 ${
                                  isCurrent
                                    ? 'text-indigo-950 dark:text-white'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                                title={subjectName}
                              >
                                {subjectName || '수업'}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-mono font-semibold text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            <span className="sm:hidden">{startTime || timeStr.split('~')[0]?.trim()}</span>
                            <span className="hidden sm:inline">
                              {startTime && endTime ? `${startTime}~${endTime}` : timeStr}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
                  등록된 시간표 정보가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SECTION: 🚨 수행평가 & 마감 안내 카드 (D-Day & D-7) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 오늘/내일 마감인 수행평가 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-rose-950 dark:text-rose-200">
                    {dayTab === 'today' ? '오늘 마감' : '내일 마감'} 수행평가 및 과제
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                  {targetDateDueNotices.length}건
                </span>
              </div>

              {targetDateDueNotices.length > 0 ? (
                <div className="space-y-2">
                  {targetDateDueNotices.map(({ notice }) => (
                    <div
                      key={notice.id}
                      onClick={() => {
                        onClose();
                        onSelectNotice?.(notice);
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-900/60 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs group"
                    >
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                          {notice.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {notice.content || '세부 안내 확인하기'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-rose-800/80 dark:text-rose-300 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{dayTab === 'today' ? '오늘' : '내일'} 마감되는 수행평가가 없습니다. 쾌적한 하루 보내세요! 🎉</span>
                </div>
              )}
            </div>

            {/* 다가오는 수행평가 (D-1 ~ D-7) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    다가오는 수행평가 (D-1 ~ D-7)
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  총 {upcomingD7Notices.length}건
                </span>
              </div>

              {upcomingD7Notices.length > 0 ? (
                <div className="space-y-2">
                  {upcomingD7Notices.slice(0, 3).map(({ notice, dday }) => (
                    <div
                      key={notice.id}
                      onClick={() => {
                        onClose();
                        onSelectNotice?.(notice);
                      }}
                      className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black shrink-0 ${
                            dday.days <= 2
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {`D-${dday.days}`}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {notice.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {notice.dateType === 'range' ? `${notice.startDate} ~ ${notice.endDate}` : notice.date}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>일주일 이내 예정된 수행평가가 없습니다.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="hidden sm:inline">
            💡 키보드 <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[10px]">Esc</kbd> 키를 누르면 창이 닫힙니다.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
