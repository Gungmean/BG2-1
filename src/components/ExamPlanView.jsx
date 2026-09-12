import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpenCheck,
  Search,
  Check,
  Edit3,
  Trash2,
  Plus,
  X,
  Save,
  FileText,
  Bookmark,
  Link as LinkIcon,
  ExternalLink,
  HelpCircle,
  Unlink,
  Calendar
} from 'lucide-react';
import {
  getExamPlans,
  updateExamPlan,
  addExamPlan,
  deleteExamPlan,
  subscribeCollection
} from '../services/syncService';
import { calculateDDay } from '../services/storageService';

export default function ExamPlanView({ isMonitor, notices = [], onSelectNotice }) {
  // Main view tab: 'scope' (시험 범위) vs 'plan' (평가계획서)
  const [activeMainTab, setActiveMainTab] = useState('scope');
  
  // In 'scope' tab: 'midterm' vs 'finals'
  const [selectedExamType, setSelectedExamType] = useState('midterm');

  const [plans, setPlans] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Scope Edit Modal for Monitor
  const [scopeEditSubject, setScopeEditSubject] = useState(null); // { plan, examType }
  const [scopeText, setScopeText] = useState('');

  // Notice Linking Modal for Monitor
  const [linkingAssessment, setLinkingAssessment] = useState(null); // { planId, assessmentId }

  // Full Plan Edit/Create Modal for Monitor
  const [isFullEditModalOpen, setIsFullEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    refreshPlans();
    const unsubscribe = subscribeCollection('exam_plans', refreshPlans);
    return unsubscribe;
  }, []);

  const refreshPlans = async () => {
    setPlans(await getExamPlans());
  };

  const categories = ['all', '국어', '수학', '영어', '과학', '체육', '제2외국어'];

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const subjectMatch = p.subject?.toLowerCase().includes(q);
        const midtermMatch = p.writtenExam?.midterm?.scope?.toLowerCase().includes(q);
        const finalsMatch = p.writtenExam?.finals?.scope?.toLowerCase().includes(q);
        const perfMatch = p.performanceAssessments?.some((pa) =>
          pa.title?.toLowerCase().includes(q)
        );
        return subjectMatch || midtermMatch || finalsMatch || perfMatch;
      }
      return true;
    });
  }, [plans, selectedCategory, searchQuery]);

  // Quick Scope Save Handler
  const handleOpenScopeEdit = (plan, examType) => {
    setScopeEditSubject({ plan, examType });
    setScopeText(plan.writtenExam?.[examType]?.scope || '');
  };

  const handleSaveQuickScope = async () => {
    if (!scopeEditSubject) return;
    const { plan, examType } = scopeEditSubject;
    const updatedPlan = {
      ...plan,
      writtenExam: {
        ...plan.writtenExam,
        [examType]: {
          ...plan.writtenExam[examType],
          scope: scopeText.trim()
        }
      }
    };
    const updatedList = await updateExamPlan(plan.id, updatedPlan);
    setPlans(updatedList);
    setScopeEditSubject(null);
  };

  // Link Notice Handler
  const handleLinkNotice = async (planId, assessmentId, noticeId) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const updatedAssessments = plan.performanceAssessments.map((pa) =>
      pa.id === assessmentId ? { ...pa, linkedNoticeId: noticeId } : pa
    );
    const updatedPlan = { ...plan, performanceAssessments: updatedAssessments };
    const updatedList = await updateExamPlan(plan.id, updatedPlan);
    setPlans(updatedList);
    setLinkingAssessment(null);
  };

  // Full Plan Edit/Add Handlers
  const handleOpenEditFull = (plan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
    setIsFullEditModalOpen(true);
  };

  const handleSaveFullModal = async (updatedData) => {
    if (!updatedData.subject.trim()) {
      alert('과목명을 입력해주세요.');
      return;
    }
    if (updatedData.id) {
      const updated = await updateExamPlan(updatedData.id, updatedData);
      setPlans(updated);
    } else {
      const updated = await addExamPlan(updatedData);
      setPlans(updated);
    }
    setIsFullEditModalOpen(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = async (id, subject) => {
    if (window.confirm(`'${subject}' 과목을 정말 삭제하시겠습니까?`)) {
      const updated = await deleteExamPlan(id);
      setPlans(updated);
    }
  };

  // Helper to find linked notice
  const getLinkedNotice = (pa, subjectName) => {
    if (pa.linkedNoticeId) {
      const found = notices.find((n) => n.id === pa.linkedNoticeId);
      if (found) return found;
    }
    // Fallback automatic search by title match
    if (subjectName) {
      const autoMatch = notices.find(
        (n) =>
          n.category === '수행평가' &&
          (n.title.includes(subjectName) || subjectName.includes(n.title.slice(0, 2)))
      );
      if (autoMatch) return autoMatch;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 shadow-sm relative overflow-hidden">
        <div className="max-w-xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-extrabold shadow-sm">
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>부광고 2학년 평가 관리 (가정통신문 공식 기준)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            2학년 2학기 <span className="text-purple-600">시험 범위</span> & <span className="text-indigo-600">평가계획서</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            독서와 작문, 영어2, 미적분1, 기하, 역학과 에너지, 세포와 물질대사, 물질과 에너지, 스포츠생활2, 일본어 등
            9개 과목의 정기시험 비율 및 공식 수행평가 목록과 평가 시기를 확인하세요.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-purple-200/40 blur-2xl pointer-events-none" />
      </div>

      {/* Main 2-Way Tab Switcher: [시험 범위] vs [평가계획서] */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 shadow-inner w-full max-w-md">
          <button
            onClick={() => setActiveMainTab('scope')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'scope'
                ? 'bg-white text-purple-700 shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>📝 시험 범위 한눈에</span>
          </button>
          <button
            onClick={() => setActiveMainTab('plan')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeMainTab === 'plan'
                ? 'bg-white text-indigo-700 shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📊 수행 & 평가계획서</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: 시험 범위 (중간고사 / 기말고사)                                 */}
      {/* ========================================================================= */}
      {activeMainTab === 'scope' && (
        <div className="space-y-6">
          {/* Sub-Switch: 중간고사 vs 기말고사 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedExamType('midterm')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  selectedExamType === 'midterm'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🍁 2학기 중간고사</span>
              </button>
              <button
                onClick={() => setSelectedExamType('finals')}
                className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  selectedExamType === 'finals'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>❄️ 2학기 기말고사</span>
              </button>
            </div>

            {/* Helper Note */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-2">
              <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
              <span>
                {isMonitor
                  ? '반장 권한으로 시험 범위를 언제든 직접 등록하거나 수정할 수 있습니다.'
                  : '시험 범위 공지 시 반장이 실시간으로 업데이트합니다.'}
              </span>
            </div>
          </div>

          {/* Exam Scope Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const examData = plan.writtenExam?.[selectedExamType];
              const ratio = examData?.ratio || 0;
              const hasScope = Boolean(examData?.scope?.trim());
              const isNoExam = ratio === 0;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Card Header: Subject Name + Category & Ratio */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                            {plan.subject}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {plan.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold block mt-0.5">
                          {plan.teacher || '교과 교사'}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-xl whitespace-nowrap shadow-sm ${
                          isNoExam
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {isNoExam ? '지필 없음' : `반영 ${ratio}%`}
                      </span>
                    </div>

                    {/* Scope Content Box */}
                    {isNoExam ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                        <span className="text-xl">🏃</span>
                        <p className="text-xs font-bold text-slate-600">지필평가 미실시</p>
                        <p className="text-[11px] text-slate-400">수행평가 100% 반영 과목입니다.</p>
                      </div>
                    ) : hasScope ? (
                      <div className="p-4 rounded-2xl bg-purple-50/30 border border-purple-100/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-black text-purple-800">
                          <Check className="w-3.5 h-3.5 text-purple-600" />
                          <span>시험 범위:</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                          {examData.scope}
                        </p>
                      </div>
                    ) : (
                      /* Clean Empty Placeholder */
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-1">
                        <p className="text-xs font-extrabold text-slate-400">
                          시험 범위 미정
                        </p>
                        <p className="text-[11px] text-slate-400">
                          공지 후 등록될 예정입니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Monitor Edit Button */}
                  {isMonitor && !isNoExam && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenScopeEdit(plan, selectedExamType)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          hasScope
                            ? 'bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 active:scale-95'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{hasScope ? '시험 범위 수정' : '시험 범위 등록'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: 전체 평가계획서 (게시판 게시물 링크 연동)                       */}
      {/* ========================================================================= */}
      {activeMainTab === 'plan' && (
        <div className="space-y-6">
          {/* Controls: Category Filter + Search + Monitor Add */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat === 'all' ? '전체 과목 (9)' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="과목 또는 수행평가 검색..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {isMonitor && (
                <button
                  onClick={() => {
                    setEditingPlan({
                      subject: '',
                      category: '국어',
                      teacher: '',
                      writtenExam: {
                        midterm: { ratio: 30, scope: '', period: '1학기 중간고사' },
                        finals: { ratio: 30, scope: '', period: '1학기 기말고사' }
                      },
                      performanceAssessments: [
                        { id: 'p_' + Date.now(), title: '1차 수행평가', ratio: 20, linkedNoticeId: null }
                      ]
                    });
                    setIsFullEditModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>과목 추가</span>
                </button>
              )}
            </div>
          </div>

          {/* Subject Assessment Cards List */}
          <div className="space-y-5">
            {filteredPlans.map((plan) => {
              const midtermRatio = plan.writtenExam?.midterm?.ratio || 0;
              const finalsRatio = plan.writtenExam?.finals?.ratio || 0;
              const perfTotalRatio =
                plan.performanceAssessments?.reduce((acc, cur) => acc + (cur.ratio || 0), 0) || 0;

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  {/* Card Header Row */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shadow-sm">
                        {plan.category.slice(0, 2)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base sm:text-lg">
                            {plan.subject}
                          </h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {plan.category}
                          </span>
                        </div>

                        {/* Ratio breakdown */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-500 flex-wrap">
                          <span>평가 반영비율:</span>
                          {plan.subject === '스포츠생활2' ? (
                            <span className="text-purple-600 font-extrabold">수행평가 100% (지필 미실시)</span>
                          ) : plan.subject === '일본어' ? (
                            <>
                              <span className="text-slate-400">중간 미실시</span>
                              <span>+</span>
                              <span className="text-indigo-600">기말 50%</span>
                              <span>+</span>
                              <span className="text-purple-600">수행 50%</span>
                              <span className="text-slate-400">(총 100%)</span>
                            </>
                          ) : (
                            <>
                              <span className="text-blue-600">중간 {midtermRatio}%</span>
                              <span>+</span>
                              <span className="text-indigo-600">기말 {finalsRatio}%</span>
                              <span>+</span>
                              <span className="text-purple-600">수행 {perfTotalRatio}%</span>
                              <span className="text-slate-400">(총 100%)</span>
                            </>
                          )}
                        </div>

                        {/* Official Exam method & essay ratio from PDF */}
                        {(plan.examMethod || plan.essayRatio) && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-600 flex-wrap">
                            {plan.examMethod && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                📝 정기시험: <strong className="text-slate-800">{plan.examMethod}</strong>
                              </span>
                            )}
                            {plan.essayRatio && plan.essayRatio !== '해당없음' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                ✍️ 서·논술형: <strong className="text-amber-900">{plan.essayRatio}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Monitor Actions */}
                    {isMonitor && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditFull(plan)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>수정</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.subject)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 text-xs font-bold transition-colors"
                          title="과목 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body: Performance Assessments with Notice Link */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 tracking-tight">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>수행평가 항목 및 학급 공지 연동</span>
                    </h4>

                    {plan.performanceAssessments && plan.performanceAssessments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {plan.performanceAssessments.map((pa, idx) => {
                          const linkedNotice = getLinkedNotice(pa, plan.subject);
                          const dday = linkedNotice ? calculateDDay(linkedNotice) : null;

                          return (
                            <div
                              key={pa.id || idx}
                              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:bg-indigo-50/10 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                                    {idx + 1}
                                  </span>
                                  <h5 className="font-black text-slate-900 text-xs sm:text-sm">
                                    {pa.title}
                                  </h5>
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-extrabold text-[10px]">
                                    배점 {pa.score || pa.ratio}점 ({pa.ratio}%)
                                  </span>
                                  {pa.evalPeriod && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                      🗓️ 시기: {pa.evalPeriod}
                                    </span>
                                  )}
                                  {pa.evalCount && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                                      횟수: {pa.evalCount}
                                    </span>
                                  )}
                                </div>

                                {/* Link action / status */}
                                {isMonitor && (
                                  <button
                                    onClick={() =>
                                      setLinkingAssessment({
                                        planId: plan.id,
                                        assessmentId: pa.id,
                                        currentNoticeId: pa.linkedNoticeId
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    <span>{linkedNotice ? '연결 게시물 변경' : '학급 게시물 연결'}</span>
                                  </button>
                                )}
                              </div>

                              {/* Linked Bulletin Notice Card or Empty State */}
                              {linkedNotice ? (
                                <div
                                  onClick={() => onSelectNotice?.(linkedNotice)}
                                  className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                      📌
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                                        {linkedNotice.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                                        {linkedNotice.date && (
                                          <span>마감: {linkedNotice.date}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {dday && !dday.isExpired && (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold text-[10px]">
                                        {dday.text}
                                      </span>
                                    )}
                                    <span className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-colors">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-white/60 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] font-medium flex items-center justify-between">
                                  <span>연결된 공지 게시물이 아직 없습니다.</span>
                                  <span className="text-[10px] text-slate-400">게시판 공지 등록 시 연동 가능</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-2">등록된 수행평가 항목이 없습니다.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOTICE LINKING SELECTOR (FOR MONITOR)                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {linkingAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setLinkingAssessment(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative z-10 bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      수행평가 게시물 연결
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      학급 게시판에 등록된 안내문 중 연결할 게시물을 선택하세요.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setLinkingAssessment(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notices List for Selection */}
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {/* Option to unlink */}
                <button
                  type="button"
                  onClick={() =>
                    handleLinkNotice(
                      linkingAssessment.planId,
                      linkingAssessment.assessmentId,
                      null
                    )
                  }
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors"
                >
                  <Unlink className="w-4 h-4 text-slate-400" />
                  <span>연결 해제 (게시물 연결 없음)</span>
                </button>

                {notices.map((n) => {
                  const isCurrent = linkingAssessment.currentNoticeId === n.id;

                  return (
                    <div
                      key={n.id}
                      onClick={() =>
                        handleLinkNotice(
                          linkingAssessment.planId,
                          linkingAssessment.assessmentId,
                          n.id
                        )
                      }
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {n.category}
                          </span>
                          {n.date && (
                            <span className="text-[10px] font-bold text-slate-400">
                              기한: {n.date}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">
                          {n.title}
                        </h4>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px]">
                          선택됨
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-indigo-600">연결</span>
                      )}
                    </div>
                  );
                })}

                {notices.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    게시판에 등록된 안내글이 없습니다.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLinkingAssessment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK SCOPE EDIT MODAL                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {scopeEditSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setScopeEditSubject(null)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative z-10 bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      {scopeEditSubject.plan.subject} 시험 범위 입력
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {scopeEditSubject.examType === 'midterm' ? '1학기 중간고사' : '1학기 기말고사'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScopeEditSubject(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  교과서 단원, 프린트, 부교재 범위 입력
                </label>
                <textarea
                  rows={5}
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  placeholder="예: 교과서 1단원 (p.10~p.45) / 3월 학력평가 독해 지문 18번~34번 프린트 2장"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-purple-500 focus:outline-none leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScopeEditSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickScope}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-200 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>시험 범위 저장</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: FULL PLAN EDIT MODAL (FOR MONITOR)                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFullEditModalOpen && editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsFullEditModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <BookOpenCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">
                      {editingPlan.id ? '과목 평가계획서 수정' : '새 과목 추가'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      과목명, 배점비율 및 수행평가 항목을 관리합니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFullEditModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form */}
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                {/* 1. Basic Subject Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">과목명 *</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 독서와 작문, 미적분1"
                      value={editingPlan.subject}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">교과 영역</label>
                    <select
                      value={editingPlan.category}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, category: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                    >
                      <option value="국어">국어</option>
                      <option value="수학">수학</option>
                      <option value="영어">영어</option>
                      <option value="과학">과학</option>
                      <option value="체육">체육</option>
                      <option value="제2외국어">제2외국어</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                </div>

                {/* 2. Written Exam Ratios */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                  <h4 className="font-black text-blue-900 text-xs">지필평가 배점 비율 (%)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-800">중간고사</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingPlan.writtenExam?.midterm?.ratio ?? 0}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              writtenExam: {
                                ...editingPlan.writtenExam,
                                midterm: {
                                  ...editingPlan.writtenExam.midterm,
                                  ratio: parseInt(e.target.value) || 0
                                }
                              }
                            })
                          }
                          className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold"
                        />
                        <span>%</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-800">기말고사</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingPlan.writtenExam?.finals?.ratio ?? 0}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              writtenExam: {
                                ...editingPlan.writtenExam,
                                finals: {
                                  ...editingPlan.writtenExam.finals,
                                  ratio: parseInt(e.target.value) || 0
                                }
                              }
                            })
                          }
                          className="w-14 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Performance Assessments List */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-indigo-900 text-xs">수행평가 항목</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editingPlan.performanceAssessments || [];
                        setEditingPlan({
                          ...editingPlan,
                          performanceAssessments: [
                            ...cur,
                            {
                              id: 'p_' + Date.now(),
                              title: `${cur.length + 1}차 수행평가`,
                              ratio: 20,
                              linkedNoticeId: null
                            }
                          ]
                        });
                      }}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>수행 항목 추가</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editingPlan.performanceAssessments?.map((pa, idx) => (
                      <div
                        key={pa.id || idx}
                        className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-black text-indigo-600 w-6">#{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="수행평가 명칭 (예: 1차 수행평가)"
                            value={pa.title}
                            onChange={(e) => {
                              const list = [...editingPlan.performanceAssessments];
                              list[idx].title = e.target.value;
                              setEditingPlan({ ...editingPlan, performanceAssessments: list });
                            }}
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">반영:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pa.ratio || 0}
                              onChange={(e) => {
                                const list = [...editingPlan.performanceAssessments];
                                list[idx].ratio = parseInt(e.target.value) || 0;
                                setEditingPlan({ ...editingPlan, performanceAssessments: list });
                              }}
                              className="w-14 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold"
                            />
                            <span>%</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingPlan.performanceAssessments.filter(
                              (_, i) => i !== idx
                            );
                            setEditingPlan({
                              ...editingPlan,
                              performanceAssessments: updated
                            });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveFullModal(editingPlan)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>저장 완료</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
