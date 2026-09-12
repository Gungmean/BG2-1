import React from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Clock, CheckCircle2 } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '수행평가', label: '수행평가' },
  { id: '학교행사', label: '학교행사' },
  { id: '외부활동', label: '외부활동' },
  { id: '기타', label: '기타' }
];

export default function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  statusTab,
  setStatusTab,
  counts
}) {
  return (
    <div className="space-y-4 mb-6">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="공지 제목 또는 내용 검색..."
            className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-full text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-100 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>정렬:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="newest">최신 등록순</option>
            <option value="deadline">마감 임박순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      {/* Category Pills with motion layoutId */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = counts.categories[cat.id] || 0;
          return (
            <motion.button
              key={cat.id}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50/50'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-blue-600 rounded-full shadow-sm shadow-blue-200"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Status Tabs with motion layoutId: 진행 중인 공지 vs 마감된 공지 */}
      <div className="bg-blue-50/60 p-1 rounded-full flex items-center gap-1 text-xs font-extrabold border border-blue-100 relative">
        <button
          type="button"
          onClick={() => setStatusTab('ongoing')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-colors ${
            statusTab === 'ongoing' ? 'text-blue-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {statusTab === 'ongoing' && (
            <motion.div
              layoutId="statusTabPill"
              className="absolute inset-0 bg-white rounded-full shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Clock className="w-3.5 h-3.5 text-blue-600 relative z-10" />
          <span className="relative z-10">진행 중인 공지</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[11px] relative z-10">
            {counts.ongoing}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('expired')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-colors ${
            statusTab === 'expired' ? 'text-slate-800 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {statusTab === 'expired' && (
            <motion.div
              layoutId="statusTabPill"
              className="absolute inset-0 bg-white rounded-full shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 relative z-10" />
          <span className="relative z-10">마감된 공지</span>
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[11px] relative z-10">
            {counts.expired}
          </span>
        </button>
      </div>
    </div>
  );
}
