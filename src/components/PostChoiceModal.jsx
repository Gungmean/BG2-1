import React from 'react';
import { Camera, Edit3, X, Sparkles } from 'lucide-react';

export default function PostChoiceModal({ isOpen, onClose, onSelectAi, onSelectManual }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              ➕ 게시물 작성 방식 선택
            </h2>
            <p className="text-xs text-slate-500">
              원하시는 등록 방식을 선택해 주세요.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
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
            className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 text-white group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <span>📸 AI 사진으로 자동 작성</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  추천
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
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
            className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition-all text-left flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 group-hover:scale-105 transition-transform">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                ✏️ 직접 수동으로 작성
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                원하는 제목과 일정, 상세 내용을 직접 작성합니다. (사진 첨부 가능)
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
