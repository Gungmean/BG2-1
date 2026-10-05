import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  X,
  SlidersHorizontal,
  Crown,
  CheckCircle2,
  Clock,
  Send,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getSuggestions,
  addSuggestion,
  voteSuggestion,
  getUserVoteStatus,
  subscribeCollection,
  updateSuggestionStatus,
  deleteSuggestion,
  addSuggestionComment,
  deleteSuggestionComment
} from '../services/syncService';
import { getSessionMonitorName } from '../services/storageService';

const SUGGESTION_CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '시설/환경', label: '시설/환경' },
  { id: '학급규칙', label: '학급규칙' },
  { id: '행사/아이디어', label: '행사/아이디어' },
  { id: '기타', label: '기타' }
];

const STATUS_BADGES = {
  pending: { label: '검토 중', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  accepted: { label: '학급회의 안건', bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  completed: { label: '해결 완료', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  rejected: { label: '보류', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' }
};

export default function SuggestionBox({ isMonitor, onOpenPinModal }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('upvotes'); // 'upvotes' | 'newest' | 'unanswered'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Q&A Comments Expand State & Reply Form State
  const [expandedCards, setExpandedCards] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyStatuses, setReplyStatuses] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});

  // New Suggestion Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '시설/환경'
  });

  useEffect(() => {
    refreshSuggestions();
    const unsubscribe = subscribeCollection('suggestions', refreshSuggestions);
    return unsubscribe;
  }, []);

  const refreshSuggestions = async () => {
    const data = await getSuggestions();
    setSuggestions(data);
  };

  const handleCreateSuggestion = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const updated = await addSuggestion(formData);
    setSuggestions(updated);
    setFormData({ title: '', content: '', category: '시설/환경' });
    setIsModalOpen(false);
  };

  const handleVote = async (id, type) => {
    const updated = await voteSuggestion(id, type);
    setSuggestions(updated);
  };

  const handleStatusChange = async (id, newStatus) => {
    const updated = await updateSuggestionStatus(id, newStatus);
    setSuggestions(updated);
  };

  const handleDelete = async (id) => {
    if (!isMonitor) {
      if (window.confirm('건의사항 삭제는 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
        onOpenPinModal && onOpenPinModal();
      }
      return;
    }

    if (window.confirm('이 건의사항을 삭제하시겠습니까?')) {
      setSuggestions((prev) => prev.filter((item) => item.id !== id));
      try {
        const updated = await deleteSuggestion(id);
        if (updated && Array.isArray(updated)) {
          setSuggestions(updated);
        }
      } catch (err) {
        console.error('Failed to delete suggestion:', err);
      }
    }
  };

  const toggleCardExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  // 반장 전용 Q&A 답변(댓글) 작성 핸들러
  const handleAddComment = async (suggestionId) => {
    if (!isMonitor) {
      if (window.confirm('댓글/답변 작성은 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
        onOpenPinModal && onOpenPinModal();
      }
      return;
    }

    const text = (replyInputs[suggestionId] || '').trim();
    if (!text) {
      alert('반장 답변 내용을 입력해 주세요.');
      return;
    }

    const monitorName = getSessionMonitorName() || '오정민';
    const chosenStatus = replyStatuses[suggestionId] || 'accepted';

    setSubmittingReply((prev) => ({ ...prev, [suggestionId]: true }));
    try {
      const updated = await addSuggestionComment(suggestionId, {
        content: text,
        authorName: monitorName,
        status: chosenStatus
      });
      setSuggestions(updated);
      setReplyInputs((prev) => ({ ...prev, [suggestionId]: '' }));
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [suggestionId]: false }));
    }
  };

  // 반장 전용 답변 삭제 핸들러
  const handleDeleteComment = async (suggestionId, commentId) => {
    if (!isMonitor) {
      if (window.confirm('답변 삭제는 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
        onOpenPinModal && onOpenPinModal();
      }
      return;
    }

    if (window.confirm('등록된 반장 공식 답변을 삭제하시겠습니까?')) {
      try {
        const updated = await deleteSuggestionComment(suggestionId, commentId);
        setSuggestions(updated);
      } catch (err) {
        console.error('Failed to delete comment:', err);
      }
    }
  };

  // Filter & Sort
  const filteredSuggestions = useMemo(() => {
    return suggestions
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') {
          return (b.upvotes || 0) - (a.upvotes || 0);
        } else if (sortBy === 'unanswered') {
          const aHasComments = Array.isArray(a.comments) && a.comments.length > 0;
          const bHasComments = Array.isArray(b.comments) && b.comments.length > 0;
          if (aHasComments === bHasComments) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return aHasComments ? 1 : -1; // 답변 대기 중인 항목을 맨 위로
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [suggestions, selectedCategory, sortBy]);

  return (
    <div className="space-y-4">
      {/* Full-width elongated action button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        <span>새로운 건의사항 작성하기</span>
      </button>

      {/* Category Pills & Sort Selector (Compact) */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 w-full sm:w-auto scrollbar-none">
          {SUGGESTION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>정렬:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs transition-colors"
          >
            <option value="upvotes">좋아요 많은 순</option>
            <option value="newest">최신 등록순</option>
            <option value="unanswered">답변 대기순 (Q&A)</option>
          </select>
        </div>
      </div>

      {/* Suggestion Cards List */}
      {filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
          {filteredSuggestions.map((item) => {
            const userVote = getUserVoteStatus(item.id);
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
            const comments = Array.isArray(item.comments) ? item.comments : [];
            const hasComments = comments.length > 0;
            // 기본값은 펼쳐진 상태 (isExpanded = true)
            const isExpanded = expandedCards[item.id] === undefined ? true : expandedCards[item.id];

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-500 transition-all space-y-3 relative"
              >
                {/* Card Header: Category & Q&A Status Badge & Class Status Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-extrabold border border-blue-100 dark:border-blue-800">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      • {item.author || '익명'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 쇼핑몰 Q&A 감성: 답변 완료 vs 답변 대기 */}
                    {hasComments ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>답변완료</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>답변대기</span>
                      </span>
                    )}

                    {/* 학급 안건 처리 상태 배지 */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>

                    {/* Class Monitor Controls: 안건 상태 직접 변경 */}
                    {isMonitor && (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg px-1.5 py-0.5 cursor-pointer focus:outline-none"
                      >
                        <option value="pending">🟡 검토</option>
                        <option value="accepted">🔵 안건</option>
                        <option value="completed">🟢 완료</option>
                        <option value="rejected">⚪ 보류</option>
                      </select>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title={isMonitor ? '건의사항 삭제' : '반장 권한으로 삭제'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title with Shopping Mall Q. prefix */}
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] leading-snug flex items-start gap-1.5">
                  <span className="text-blue-600 dark:text-blue-400 font-black shrink-0 text-base">Q.</span>
                  <span className="pt-0.5">{item.title}</span>
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-5">
                  {item.content}
                </p>

                {/* Footer: Date & Up/Down Vote & Comment Toggle */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {/* Toggle Comments Button */}
                  <button
                    type="button"
                    onClick={() => toggleCardExpand(item.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>반장 답변 {hasComments ? `(${comments.length})` : ''}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, 'up')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs transition-all active:scale-90 cursor-pointer ${
                        userVote === 'up'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title="이 건의에 찬성합니다"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${userVote === 'up' ? 'fill-white' : ''}`} />
                      <span>{item.upvotes || 0}</span>
                    </button>

                    {/* Downvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, 'down')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xl font-bold text-xs transition-all active:scale-90 cursor-pointer ${
                        userVote === 'down'
                          ? 'bg-slate-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-750 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                      title="이 건의에 반대합니다"
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${userVote === 'down' ? 'fill-white' : ''}`} />
                      <span>{item.downvotes || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Q&A Official Answers Section (쇼핑몰 Q&A 감성) */}
                {isExpanded && (
                  <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-200">
                    {/* Official Answers List */}
                    {hasComments ? (
                      <div className="space-y-2">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 sm:p-3.5 space-y-1.5 transition-colors relative"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>반장 공식 답변</span>
                                </span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {comment.authorName ? `${comment.authorName} 반장` : '2-1 반장'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                <span>
                                  {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {isMonitor && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(item.id, comment.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                                    title="답변 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Answer Text in Shopping Mall Q&A Style */}
                            <div className="flex items-start gap-2 pt-0.5">
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                                A.
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap flex-1">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !isMonitor && (
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>아직 등록된 반장 공식 답변이 없습니다.</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('답변 작성은 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
                                onOpenPinModal && onOpenPinModal();
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 cursor-pointer"
                          >
                            <Lock className="w-3 h-3" />
                            <span>반장 인증 후 답변 달기</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* President Reply Form (반장 인증을 거친 사람만 노출 및 작성 가능) */}
                    {isMonitor ? (
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                            <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                            <span>반장 공식 답변 작성</span>
                          </span>

                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">안건 상태 변경:</span>
                            <select
                              value={replyStatuses[item.id] || (item.status === 'pending' ? 'accepted' : item.status)}
                              onChange={(e) => setReplyStatuses({ ...replyStatuses, [item.id]: e.target.value })}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <option value="accepted">🔵 학급회의 안건</option>
                              <option value="completed">🟢 해결 완료</option>
                              <option value="pending">🟡 검토 중</option>
                              <option value="rejected">⚪ 보류</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start">
                          <textarea
                            rows={2}
                            value={replyInputs[item.id] || ''}
                            onChange={(e) => setReplyInputs({ ...replyInputs, [item.id]: e.target.value })}
                            placeholder="쇼핑몰 Q&A 판매자 답변처럼 건의에 대한 반장 공식 답변을 작성해주세요..."
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none transition-colors"
                          />
                          <button
                            type="button"
                            disabled={submittingReply[item.id]}
                            onClick={() => handleAddComment(item.id)}
                            className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 shrink-0 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>등록</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      hasComments && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('답변 추가 작성은 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
                                onOpenPinModal && onOpenPinModal();
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3 h-3" />
                            <span>반장 인증 후 추가 답변 달기</span>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2.5 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto text-lg">
            💬
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            등록된 건의사항이 없습니다
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            학급 생활 개선을 위한 익명 건의사항을 새로 작성해보세요.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-all mt-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>건의 작성하기</span>
          </button>
        </div>
      )}

      {/* New Suggestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  ✍️ 익명 건의 작성
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  작성자 정보는 저장되지 않으며 100% 익명으로 제출됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSuggestion} className="space-y-3.5">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  카테고리
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SUGGESTION_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.category === cat.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  건의 제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 교실 에어컨 온도 설정 건의"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  건의 상세 내용
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="학급 회의에서 논의하고 싶은 구체적인 건의 내용을 입력해 주세요."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-850 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                >
                  제출하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
