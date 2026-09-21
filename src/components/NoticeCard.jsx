import React, { forwardRef } from 'react';
import { Calendar, Pin, Trash2, Edit3, Clock, Images } from 'lucide-react';
import { calculateDDay } from '../services/storageService';

const CATEGORY_STYLES = {
  수행평가: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200/80 dark:border-rose-800/60', dot: 'bg-rose-500' },
  학교행사: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/80 dark:border-blue-800/60', dot: 'bg-blue-500' },
  외부활동: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-800/60', dot: 'bg-emerald-500' },
  기타: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200/80 dark:border-slate-700', dot: 'bg-slate-400 dark:text-slate-500' }
};

const NoticeCard = forwardRef(function NoticeCard({
  notice,
  isMonitor,
  onSelect,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenPinModal,
  selected = false
}, ref) {
  const dday = calculateDDay(notice);
  const catStyle = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES['기타'];

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

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(notice);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    onTogglePin(notice.id);
  };

  const displayDateText =
    notice.dateType === 'none' || (!notice.date && !notice.startDate && !notice.endDate)
      ? '상시'
      : notice.dateType === 'range' && notice.startDate && notice.endDate
      ? `${notice.startDate} ~ ${notice.endDate}`
      : notice.date || notice.startDate || '';

  const multiImageCount = Array.isArray(notice.imageUrls) ? notice.imageUrls.length : (notice.imageUrl ? 1 : 0);

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={`${notice.title} 공지사항 카드`}
      onClick={() => onSelect(notice)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(notice);
        }
      }}
      className={`group relative flex items-stretch rounded-2xl bg-white dark:bg-slate-850 border transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : notice.pinned
          ? 'border-indigo-300/80 dark:border-indigo-700/80 bg-gradient-to-r from-indigo-50/20 via-white to-white dark:from-indigo-950/20 dark:via-slate-850 dark:to-slate-850'
          : 'border-slate-200/90 dark:border-slate-750 hover:border-blue-300 dark:hover:border-slate-650'
      }`}
    >
      {/* 1. LEFT THUMBNAIL AREA (Strictly aspect-square 112px x 112px) */}
      <div className="w-28 h-28 aspect-square shrink-0 relative bg-slate-100 dark:bg-slate-800 overflow-hidden select-none">
        {notice.imageUrl ? (
          <img
            src={notice.imageUrl}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 block"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/70 dark:from-slate-800 dark:to-slate-850 text-slate-400 dark:text-slate-500 p-2 text-center">
            <span className="text-xl sm:text-2xl mb-0.5">📢</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-full">
              {notice.category}
            </span>
          </div>
        )}

        {/* Pinned Tag on Thumbnail */}
        {notice.pinned && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black flex items-center gap-0.5 shadow-xs z-10">
            <Pin className="w-2.5 h-2.5 fill-white" />
            <span>고정</span>
          </div>
        )}

        {/* Multi-image count badge */}
        {multiImageCount > 1 && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] font-black flex items-center gap-1 shadow-xs z-10">
            <Images className="w-2.5 h-2.5" />
            <span>{multiImageCount}</span>
          </div>
        )}
      </div>

      {/* 2. RIGHT CONTENT AREA (Title, Category, D-Day & Actions) */}
      <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Top Badges: Category & D-Day / Ongoing Status */}
          <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
              {notice.category}
            </span>

            {/* D-Day Badge with '진행 중' support */}
            {dday.isExpired ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                마감됨
              </span>
            ) : dday.text === '진행 중' ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                진행 중
              </span>
            ) : dday.text === '오늘 종료' ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-xs shrink-0 animate-pulse">
                오늘 종료
              </span>
            ) : dday.days === 0 ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-xs shrink-0 animate-pulse">
                D-DAY
              </span>
            ) : dday.text === '기한 없음' ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                상시
              </span>
            ) : dday.days <= 3 ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs shrink-0">
                {dday.text}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs shrink-0">
                {dday.text}
              </span>
            )}
          </div>

          {/* Title (Max 2 lines, clean size) */}
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug break-keep">
            {notice.title}
          </h3>
        </div>

        {/* Bottom Row: Date Indicator & Actions */}
        <div className="flex items-center justify-between gap-1.5 pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 min-w-0 font-medium">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{displayDateText}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-auto">
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
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
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
              className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default React.memo(NoticeCard);
