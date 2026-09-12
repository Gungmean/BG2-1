import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Calendar, Pin, Trash2, Edit3, ChevronRight, Clock, Image as ImageIcon } from 'lucide-react';
import { calculateDDay } from '../services/storageService';

const CATEGORY_STYLES = {
  수행평가: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500' },
  학교행사: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  외부활동: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  기타: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/80', dot: 'bg-slate-400' }
};

const NoticeCard = forwardRef(function NoticeCard({
  notice,
  isMonitor,
  onSelect,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenPinModal
}, ref) {
  const dday = calculateDDay(notice);
  const catStyle = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.기타;

  const displayDateText =
    notice.dateType === 'range' && notice.startDate && notice.endDate
      ? `${notice.startDate} ~ ${notice.endDate}`
      : notice.date || notice.startDate || '기한 없음';

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (!isMonitor) {
      if (window.confirm('게시물 삭제는 반장 권한이 필요합니다. 반장 인증 창으로 이동하시겠습니까?')) {
        onOpenPinModal && onOpenPinModal();
      }
    } else {
      onDelete(notice.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={() => onSelect(notice)}
      className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm ${
        notice.pinned
          ? 'border-blue-400/90 ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-50/20 to-white'
          : 'border-slate-200/80 hover:border-blue-300'
      }`}
    >
      {/* Pinned Tag Banner - Compact */}
      {notice.pinned && (
        <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Pin className="w-2.5 h-2.5 fill-white" /> 주요 공지
          </span>
          <span className="text-[9px] text-blue-100">상단 고정</span>
        </div>
      )}

      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: Category Badge & D-Day Badge */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
              {notice.category}
            </span>

            {/* D-Day Counter (Compact) */}
            {dday.isExpired ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {dday.text}
              </span>
            ) : dday.days === 0 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                오늘 마감
              </span>
            ) : dday.days <= 3 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                {dday.text}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                {dday.text}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
            {notice.title}
          </h3>

          {/* Date Indicator & Media indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{displayDateText}</span>
            </div>
            {notice.imageUrl && (
              <span className="shrink-0 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1">
                <ImageIcon className="w-2.5 h-2.5" /> 사진
              </span>
            )}
          </div>

          {/* Content Snippet: 1.5 lines clamp */}
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {notice.content}
          </p>
        </div>

        {/* Footer Row: Author & Action Buttons */}
        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium text-slate-500 truncate max-w-[120px]">
            {notice.author || '학급반장'}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {isMonitor && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(notice.id);
                  }}
                  title={notice.pinned ? '고정 해제' : '상단 고정'}
                  className={`p-1 rounded-md transition-colors ${
                    notice.pinned
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(notice);
                  }}
                  title="수정"
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Delete Button */}
            <button
              type="button"
              onClick={handleDeleteClick}
              title="게시물 삭제"
              className={`p-1 rounded-md transition-colors flex items-center font-bold ${
                isMonitor
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <span className="ml-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold flex items-center gap-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              상세 <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default NoticeCard;
