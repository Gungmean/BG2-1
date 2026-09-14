import React, { useState, useEffect } from 'react';
import { X, Key, Download, Upload, RefreshCw, CheckCircle2, Sparkles, Database, RotateCcw, Smartphone } from 'lucide-react';
import { getLocalDateString, getStoredApiKey, setStoredApiKey, exportDataJSON, importDataJSON, resetNoticesToDefault } from '../services/storageService';
import { isSupabaseEnabled } from '../services/syncService';

export default function SettingsModal({ isOpen, onClose, onRefreshData }) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isOpen]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        '💡 [부광이일] 앱 설치 안내:\n\n' +
        '• 아이폰(Safari): 하단 [공유(네모+화살표)] 버튼 클릭 후 [홈 화면에 추가]를 눌러주세요.\n' +
        '• 안드로이드(Chrome): 우측 상단 메뉴(점 3개) 클릭 후 [앱 설치] 또는 [홈 화면에 추가]를 눌러주세요.'
      );
    }
  };

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
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-5 sm:p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
            {isSupabaseEnabled
              ? 'Supabase 자동 동기화가 활성화되어 PC와 휴대폰에서 같은 데이터를 사용합니다.'
              : '현재는 로컬 저장 모드입니다. Supabase 환경변수를 설정하면 자동 동기화가 활성화됩니다.'}
          </p>
          <div
            className={`p-3 rounded-xl border text-xs font-bold ${
              isSupabaseEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isSupabaseEnabled ? '자동 동기화: 켜짐' : '자동 동기화: 꺼짐 (로컬 저장만 사용 중)'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* PWA App Installation Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                스마트폰 / PC 앱으로 설치 (PWA)
              </span>
            </div>
            {isInstalled && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                설치됨
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            부광이일을 홈 화면에 앱으로 추가하면 브라우저 주소창 없이 실제 어플처럼 전체 화면으로 빠르고 편리하게 이용할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalled ? '앱 설치 안내 다시보기' : '부광이일 앱 설치하기'}</span>
          </button>
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
