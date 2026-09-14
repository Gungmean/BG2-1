import React from 'react';
import { Camera, Edit3, X, Sparkles } from 'lucide-react';

export default function PostChoiceModal({ isOpen, onClose, onSelectAi, onSelectManual }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6 space-y-5 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              ➕ 게시물 작성 방식 선택
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              원하시는 등록 방식을 선택해 주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Choice Buttons */}
        <div className="space-y-3">
          {/* AI Photo Scan Choice */}
          <button
            onClick={() => {
              onClose();
              onSelectAi();
            }}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <span>📸 AI 사진으로 자동 작성</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  추천
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                학급 포스터/안내문 사진을 올리면 AI가 알아서 제목과 일정을 요약해 줍니다.
              </p>
            </div>
          </button>

          {/* Manual Input Choice */}
          <button
            onClick={() => {
              onClose();
              onSelectManual();
            }}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:scale-105 transition-transform">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                ✏️ 직접 수동으로 작성
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                원하는 제목과 일정, 상세 내용을 직접 작성합니다. (사진 첨부 가능)
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
