import React, { useState, useEffect } from 'react';
import { X, Key, Download, Upload, RefreshCw, CheckCircle2, Sparkles, Database, RotateCcw } from 'lucide-react';
import { getLocalDateString, getStoredApiKey, setStoredApiKey, exportDataJSON, importDataJSON, resetNoticesToDefault, getNotices } from '../services/storageService';

export default function SettingsModal({ isOpen, onClose, onRefreshData }) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    setStoredApiKey(apiKey);
    setSaveStatus('Gemini API 키가 성공적으로 저장되었습니다!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleExport = () => {
    const dataUrl = exportDataJSON();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `classboard_backup_${getLocalDateString()}.json`;
    a.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importDataJSON(event.target.result);
      if (result.success) {
        setImportStatus(`성공! ${result.count}개의 게시물이 동기화되었습니다.`);
        onRefreshData();
      } else {
        setImportStatus(`오류: ${result.error}`);
      }
      setTimeout(() => setImportStatus(''), 4000);
    };
    reader.readAsText(file);
  };

  const handleResetNotices = () => {
    if (window.confirm('게시판을 초기 상태로 복구하고 중복 데이터를 모두 정리하시겠습니까?')) {
      resetNoticesToDefault();
      onRefreshData();
      setImportStatus('게시판이 기본 상태로 안전하게 복구되었습니다.');
      setTimeout(() => setImportStatus(''), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                ⚙️ 설정 및 웹/모바일 데이터 동기화
              </h2>
              <p className="text-xs text-slate-500">
                AI Vision API 키 및 게시판 데이터 관리
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini API Key Config */}
        <form onSubmit={handleSaveKey} className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-indigo-600" />
            Google Gemini Vision API Key 설정 (선택)
          </label>
          <p className="text-xs text-slate-500 leading-normal">
            실제 안내문 사진 OCR 및 AI 상세 분석을 위해 Gemini API Key를 입력할 수 있습니다. 입력하지 않으면 기기 내 OCR 모드로 동작합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              저장
            </button>
          </div>
          {saveStatus && (
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
            </p>
          )}
        </form>

        {/* Data Sync & Export/Import */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            웹 & 모바일 게시물 데이터 백업 및 동기화
          </label>
          <p className="text-xs text-slate-500">
            다른 기기(PC, 휴대폰)로 게시물 데이터를 이동하거나 백업 파일을 복원할 수 있습니다.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>데이터 백업 (내보내기)</span>
            </button>

            <label className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>데이터 동기화 (불러오기)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset notices button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetNotices}
              className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>게시물 중복 정리 및 기본값으로 초기화</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              {importStatus}
            </p>
          )}
        </div>

        {/* Footer button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
