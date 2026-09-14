import React from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Clock, CheckCircle2 } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '학사일정', label: '학사일정' },
  { id: '수행평가', label: '수행평가' },
  { id: '학교행사', label: '학교행사' },
  { id: '외부활동', label: '외부활동' },
  { id: '기타', label: '기타' }
];

function CategoryFilter({
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
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="공지 제목 또는 내용 검색..."
            className="w-full pl-10 pr-8 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-full text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs bg-slate-100 dark:bg-slate-750 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>정렬:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 cursor-pointer shadow-sm transition-colors"
          >
            <option value="newest">최신 등록순</option>
            <option value="deadline">마감 임박순</option>
            <option value="oldest">오래된순</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = counts.categories[cat.id] || 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-colors duration-75 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none'
                  : 'bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-slate-750'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors duration-75 ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-750 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Tabs: 진행 중인 공지 vs 마감된 공지 */}
      <div className="bg-blue-50/60 dark:bg-slate-850 p-1 rounded-full flex items-center gap-1 text-xs font-extrabold border border-blue-100 dark:border-slate-750 relative transition-colors">
        <button
          type="button"
          onClick={() => setStatusTab('ongoing')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-colors duration-75 ${
            statusTab === 'ongoing'
              ? 'bg-white dark:bg-slate-750 text-blue-700 dark:text-blue-300 font-extrabold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>진행 중인 공지</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              statusTab === 'ongoing'
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold'
                : 'bg-slate-200/70 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
            }`}
          >
            {counts.ongoing}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('expired')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2 rounded-full transition-colors duration-75 ${
            statusTab === 'expired'
              ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-slate-100 font-extrabold shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>마감된 공지</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              statusTab === 'expired'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold'
                : 'bg-slate-200/70 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
            }`}
          >
            {counts.expired}
          </span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(CategoryFilter);
