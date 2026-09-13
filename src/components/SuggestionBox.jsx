import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ThumbsUp, ThumbsDown, MessageSquare, Trash2, X, SlidersHorizontal } from 'lucide-react';
import {
  getSuggestions,
  addSuggestion,
  voteSuggestion,
  getUserVoteStatus,
  subscribeCollection,
  updateSuggestionStatus,
  deleteSuggestion
} from '../services/syncService';

const SUGGESTION_CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '시설/환경', label: '시설/환경' },
  { id: '학급규칙', label: '학급규칙' },
  { id: '행사/아이디어', label: '행사/아이디어' },
  { id: '기타', label: '기타' }
];

const STATUS_BADGES = {
  pending: { label: '검토 중', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  accepted: { label: '학급회의 안건', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  completed: { label: '해결 완료', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  rejected: { label: '보류', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

export default function SuggestionBox({ isMonitor, onOpenPinModal }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('upvotes'); // 'upvotes' | 'newest'
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Optimistic update for instant UI feedback
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
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [suggestions, selectedCategory, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top Banner Card (Compact & Sleek) */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-semibold mb-0.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-200" />
            <span>익명 소통함</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black">학급 익명 건의함</h2>
          <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">
            학급 생활 개선 및 아이디어를 남겨보세요. 학생들의 찬반 투표를 거쳐 학급회의 안건으로 채택됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white text-blue-700 rounded-xl font-extrabold text-xs shadow-xs hover:bg-blue-50 active:scale-95 transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>건의 작성하기</span>
        </button>
      </div>

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
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>정렬:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="upvotes">좋아요 많은 순</option>
            <option value="newest">최신 등록순</option>
          </select>
        </div>
      </div>

      {/* Suggestion Cards List (Compact) */}
      {filteredSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
          {filteredSuggestions.map((item) => {
            const userVote = getUserVoteStatus(item.id);
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all space-y-2 relative"
              >
                {/* Card Header: Category & Status Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-extrabold border border-blue-100">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      • {item.author || '익명'}
                    </span>
                  </div>

                  {/* Status Badge & Monitor/Delete Controls */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>

                    {/* Class Monitor Controls */}
                    {isMonitor && (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg px-1.5 py-0.5 cursor-pointer focus:outline-none"
                      >
                        <option value="pending">🟡 검토</option>
                        <option value="accepted">🔵 안건</option>
                        <option value="completed">🟢 완료</option>
                        <option value="rejected">⚪ 보류</option>
                      </select>
                    )}

                    {/* Delete Button (Always accessible) */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={isMonitor ? '건의사항 삭제' : '반장 권한으로 삭제'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm sm:text-[15px] leading-snug">
                  {item.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>

                {/* Footer: Date & Up/Down Vote Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400 font-medium text-[10px] sm:text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {/* Vote Buttons Row (Compact) */}
                  <div className="flex items-center gap-1.5">
                    {/* 좋아요 Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, 'up')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        userVote === 'up'
                          ? 'bg-blue-600 text-white shadow-2xs scale-105'
                          : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/70'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${userVote === 'up' ? 'fill-white' : ''}`} />
                      <span>{item.upvotes || 0}</span>
                    </button>

                    {/* 별로예요 Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id, 'down')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        userVote === 'down'
                          ? 'bg-rose-600 text-white shadow-2xs scale-105'
                          : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/70'
                      }`}
                    >
                      <ThumbsDown className={`w-3 h-3 ${userVote === 'down' ? 'fill-white' : ''}`} />
                      <span>{item.downvotes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto text-lg">
            💬
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            등록된 건의사항이 없습니다
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            학급 생활 개선을 위한 익명 건의사항을 새로 작성해보세요.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-all mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>건의 작성하기</span>
          </button>
        </div>
      )}

      {/* New Suggestion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base">
                  ✍️ 익명 건의 작성
                </h2>
                <p className="text-xs text-slate-500">
                  작성자 정보는 저장되지 않으며 100% 익명으로 제출됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSuggestion} className="space-y-3.5">
              {/* Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  카테고리
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SUGGESTION_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        formData.category === cat.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  건의 제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 교실 에어컨 온도 설정 건의"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  건의 상세 내용
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="학급 회의에서 논의하고 싶은 구체적인 건의 내용을 입력해 주세요."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
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
