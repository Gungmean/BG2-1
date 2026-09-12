import React, { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Calendar, Pin, Trash2, Edit3, Clock, ImageOff } from 'lucide-react';
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
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={() => onSelect(notice)}
      className={`group relative bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
        notice.pinned
          ? 'border-blue-400/90 ring-1 ring-blue-500/20'
          : 'border-slate-200/90 hover:border-blue-300'
      }`}
    >
      {/* Pinned Tag Banner */}
      {notice.pinned && (
        <div className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Pin className="w-2.5 h-2.5 fill-white" /> 주요 공지
          </span>
          <span className="text-[9px] text-blue-100">상단 고정</span>
        </div>
      )}

      {/* Card Thumbnail Image Area */}
      <div className="relative w-full h-32 sm:h-36 bg-slate-100 overflow-hidden">
        {notice.imageUrl ? (
          <img
            src={notice.imageUrl}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-400">
            <span className="text-2xl mb-1">📢</span>
            <span className="text-[10px] font-medium text-slate-400">안내문</span>
          </div>
        )}

        {/* Overlay Badges on Top of Thumbnail */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Category Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs backdrop-blur-md ${catStyle.bg}/95 ${catStyle.text} border ${catStyle.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
            {notice.category}
          </span>

          {/* D-Day Counter */}
          {dday.isExpired ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/70 text-white backdrop-blur-xs flex items-center gap-0.5 shadow-xs">
              <Clock className="w-2.5 h-2.5" />
              {dday.text}
            </span>
          ) : dday.days === 0 ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse">
              오늘 마감
            </span>
          ) : dday.days <= 3 ? (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
              {dday.text}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs">
              {dday.text}
            </span>
          )}
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Title (max 2 lines) */}
          <h3 className="font-bold text-slate-900 text-[13px] group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {notice.title}
          </h3>

          {/* Date Indicator */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{displayDateText}</span>
          </div>
        </div>

        {/* Footer Row: Author & Actions */}
        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-medium text-slate-500 truncate max-w-[90px]">
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
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default NoticeCard;
