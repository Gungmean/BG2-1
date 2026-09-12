import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Plus, Inbox, Crown } from 'lucide-react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import ScheduleInfo from './components/ScheduleInfo';
import SuggestionBox from './components/SuggestionBox';
import NoticeCalendarView from './components/NoticeCalendarView';
import CategoryFilter from './components/CategoryFilter';
import NoticeCard from './components/NoticeCard';
import PostChoiceModal from './components/PostChoiceModal';
import DetailModal from './components/DetailModal';
import PinLoginModal from './components/PinLoginModal';
import SettingsModal from './components/SettingsModal';
import TodayReportCard from './components/TodayReportCard';
import {
  addNotice,
  deleteNotice,
  getNotices,
  subscribeCollection,
  togglePinNotice,
  updateNotice
} from './services/syncService';
import {
  calculateDDay,
  getLocalDateString,
  getSessionMonitorStatus,
  setSessionMonitorStatus
} from './services/storageService';

const AiUploadModal = React.lazy(() => import('./components/AiUploadModal'));
const DrawPageView = React.lazy(() => import('./components/DrawPageView'));
const ExamPlanView = React.lazy(() => import('./components/ExamPlanView'));

function LoadingPanel({ label = '화면을 불러오는 중입니다...' }) {
  return (
    <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
      {label}
    </div>
  );
}

export default function App() {
  const [notices, setNotices] = useState([]);
  const [isMonitor, setIsMonitorState] = useState(() => getSessionMonitorStatus());
  const setIsMonitor = (val) => {
    setIsMonitorState(val);
    setSessionMonitorStatus(val);
  };
  const [activeBottomNav, setActiveBottomNav] = useState('board'); // 'board' | 'suggestion' | 'calendar'
  const [calendarSubTab, setCalendarSubTab] = useState('monthCalendar'); // 'schedule' | 'monthCalendar'

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'deadline' | 'oldest'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('ongoing'); // 'ongoing' | 'expired'

  // Modal states
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [aiModalInitialMode, setAiModalInitialMode] = useState('ai'); // 'ai' | 'manual'
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial load
  useEffect(() => {
    refreshNotices();
    const unsubscribe = subscribeCollection('notices', refreshNotices);
    return unsubscribe;
  }, []);

  const refreshNotices = async () => {
    const data = await getNotices();
    setNotices(data);
  };

  // Notice CRUD handlers
  const handleSaveNotice = async (noticeData) => {
    if (noticeData.id) {
      // Update
      const updated = await updateNotice(noticeData.id, noticeData);
      setNotices(updated);
    } else {
      // Create new
      const updated = await addNotice(noticeData);
      setNotices(updated);
    }
    setEditingNotice(null);
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
      const updated = await deleteNotice(id);
      setNotices(updated);
    }
  };

  const handleTogglePin = async (id) => {
    const updated = await togglePinNotice(id);
    setNotices(updated);
  };

  const handleOpenAddNoticeFromCalendar = (dateStr) => {
    const defaultDate = dateStr || getLocalDateString();
    setEditingNotice({
      title: '',
      content: '',
      category: '학사일정',
      dateType: 'single',
      date: defaultDate,
      startDate: defaultDate,
      endDate: defaultDate
    });
    setAiModalInitialMode('manual');
    setIsAiModalOpen(true);
  };

  // Category & Status Counts Calculation
  const counts = useMemo(() => {
    const categoriesCount = { all: notices.length };
    let ongoingCount = 0;
    let expiredCount = 0;

    notices.forEach((n) => {
      // Category counts
      categoriesCount[n.category] = (categoriesCount[n.category] || 0) + 1;

      // Ongoing vs Expired counts
      const dday = calculateDDay(n);
      if (dday.isExpired) {
        expiredCount++;
      } else {
        ongoingCount++;
      }
    });

    return {
      categories: categoriesCount,
      ongoing: ongoingCount,
      expired: expiredCount
    };
  }, [notices]);

  // Filtered & Sorted Notices List
  const filteredNotices = useMemo(() => {
    return notices
      .filter((n) => {
        // 1. Status Filter (진행 중 vs 마감)
        const dday = calculateDDay(n);
        if (statusTab === 'ongoing' && dday.isExpired) return false;
        if (statusTab === 'expired' && !dday.isExpired) return false;

        // 2. Category Filter
        if (selectedCategory !== 'all' && n.category !== selectedCategory) {
          return false;
        }

        // 3. Search Query Filter
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const titleMatch = n.title.toLowerCase().includes(q);
          const contentMatch = n.content.toLowerCase().includes(q);
          const catMatch = n.category.toLowerCase().includes(q);
          return titleMatch || contentMatch || catMatch;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned posts always stay on top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Sort rules
        if (sortBy === 'deadline') {
          const dateA = new Date(a.date || '2099-12-31').getTime();
          const dateB = new Date(b.date || '2099-12-31').getTime();
          return dateA - dateB;
        } else if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          // 'newest' default
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [notices, selectedCategory, sortBy, searchQuery, statusTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24 selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <Header
        isMonitor={isMonitor}
        onOpenPinModal={() => setIsPinModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={refreshNotices}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-3 sm:pt-6">
        {/* Today's Daily Report & Briefing Card */}
        <TodayReportCard
          notices={notices}
          onNavigate={(tab, subTab) => {
            if (subTab) setCalendarSubTab(subTab);
            setActiveBottomNav(tab);
          }}
          onSelectNotice={(n) => setSelectedNotice(n)}
        />

        {/* Banner for Student vs Monitor status */}
        <div className="mb-5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3 text-xs text-blue-950 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] shrink-0">
              안내
            </span>
            <span className="truncate sm:whitespace-normal">
              {isMonitor ? (
                <span>
                  👑 <strong className="text-blue-900 font-bold">반장 모드 활성화</strong>: 게시글 작성, AI 스캔, 수정 및 삭제 권한이 있습니다.
                </span>
              ) : (
                <span>
                  👀 <strong>학생 공지 모드</strong>: 반장에 의해 등록된 학급 안내문과 주간 일정을 확인하는 중입니다.
                </span>
              )}
            </span>
          </div>

          <div className="shrink-0">
            {isMonitor ? (
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>관리</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>반장 인증</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: 게시판 */}
        {activeBottomNav === 'board' && (
          <div>
            {/* Top Toolbar: Category Filter, Search, Sort & Status Tabs */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusTab={statusTab}
              setStatusTab={setStatusTab}
              counts={counts}
            />

            {/* Notice Cards Grid with motion layout */}
            {filteredNotices.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <AnimatePresence>
                  {filteredNotices.map((notice) => (
                    <NoticeCard
                      key={notice.id}
                      notice={notice}
                      isMonitor={isMonitor}
                      onSelect={(n) => setSelectedNotice(n)}
                      onEdit={(n) => {
                        setEditingNotice(n);
                        setIsAiModalOpen(true);
                      }}
                      onDelete={handleDeleteNotice}
                      onTogglePin={handleTogglePin}
                      onOpenPinModal={() => setIsPinModalOpen(true)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Empty state */
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto shadow-sm">
                  <Inbox className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  해당하는 게시물이 없습니다
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `'${searchQuery}' 검색어와 일치하는 안내물이 없습니다.`
                    : statusTab === 'expired'
                    ? '마감된 게시물이 아직 없습니다.'
                    : '등록된 게시물이 없습니다. 새로운 학급 소식을 등록해보세요.'}
                </p>
                {isMonitor && (
                  <button
                    onClick={() => {
                      setEditingNotice(null);
                      setIsAiModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold shadow hover:bg-blue-700 transition-all mt-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>사진으로 게시물 등록하기</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 건의함 (Suggestion Box) */}
        {activeBottomNav === 'suggestion' && (
          <SuggestionBox isMonitor={isMonitor} />
        )}

        {/* TAB 3: 일정 & 캘린더 (Calendar & Meal & Timetable) */}
        {activeBottomNav === 'calendar' && (
          <div className="space-y-4">
            {/* Sub Tab Navigation Buttons */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-200">
              <button
                onClick={() => setCalendarSubTab('monthCalendar')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  calendarSubTab === 'monthCalendar'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📅 학급 월간 달력</span>
              </button>

              <button
                onClick={() => setCalendarSubTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                  calendarSubTab === 'schedule'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🍱 주간 급식 & 시간표</span>
              </button>
            </div>

            {/* Sub Tab Contents */}
            {calendarSubTab === 'monthCalendar' ? (
              <NoticeCalendarView
                notices={notices}
                isMonitor={isMonitor}
                onSelectNotice={(n) => setSelectedNotice(n)}
                onAddSchedule={handleOpenAddNoticeFromCalendar}
                onOpenPinModal={() => setIsPinModalOpen(true)}
              />
            ) : (
              <ScheduleInfo />
            )}
          </div>
        )}

        {/* TAB 4: 스마트 뽑기 & 자리배치 (Draw & Seat View) */}
        {activeBottomNav === 'draw' && (
          <Suspense fallback={<LoadingPanel label="스마트 뽑기 화면을 불러오는 중입니다..." />}>
            <DrawPageView />
          </Suspense>
        )}

        {/* TAB 5: 평가계획서 & 시험 범위 (Exam & Evaluation Plans) */}
        {activeBottomNav === 'examPlan' && (
          <Suspense fallback={<LoadingPanel label="평가계획서 화면을 불러오는 중입니다..." />}>
            <ExamPlanView
              isMonitor={isMonitor}
              notices={notices}
              onSelectNotice={(n) => setSelectedNotice(n)}
            />
          </Suspense>
        )}
      </main>

      {/* Floating Action Button (FAB) in Riroschool Style */}
      {isMonitor && (
        <div className="fixed bottom-20 right-4 sm:right-8 z-30">
          <button
            onClick={() => {
              setEditingNotice(null);
              setIsChoiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all group"
          >
            <Plus className="w-4 h-4" />
            <span>게시물 작성</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation with Center Semicircle Radial Menu */}
      <Navbar
        activeTab={activeBottomNav}
        setActiveTab={setActiveBottomNav}
      />

      {/* Choice Modal for AI vs Manual */}
      <PostChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onSelectAi={() => {
          setAiModalInitialMode('ai');
          setIsAiModalOpen(true);
        }}
        onSelectManual={() => {
          setAiModalInitialMode('manual');
          setIsAiModalOpen(true);
        }}
      />

      {/* Modals */}
      {isAiModalOpen && (
        <Suspense fallback={null}>
          <AiUploadModal
            isOpen={isAiModalOpen}
            initialMode={aiModalInitialMode}
            onClose={() => {
              setIsAiModalOpen(false);
              setEditingNotice(null);
            }}
            onSaveNotice={handleSaveNotice}
            editNoticeData={editingNotice}
          />
        </Suspense>
      )}

      <DetailModal
        notice={selectedNotice}
        isMonitor={isMonitor}
        onClose={() => setSelectedNotice(null)}
        onEdit={(n) => {
          setSelectedNotice(null);
          setEditingNotice(n);
          setIsAiModalOpen(true);
        }}
        onDelete={(id) => {
          setSelectedNotice(null);
          handleDeleteNotice(id);
        }}
        onTogglePin={handleTogglePin}
        onOpenPinModal={() => setIsPinModalOpen(true)}
      />

      <PinLoginModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        isMonitor={isMonitor}
        setIsMonitor={setIsMonitor}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshData={refreshNotices}
      />
    </div>
  );
}
