import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, Sparkles, Sliders, Smartphone, Download, Sun, Moon, Laptop } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/storageService';
import { useTheme } from '../context/ThemeContext';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { theme, setTheme } = useTheme();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                ⚙️ 부광이일 설정
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                화면 테마, AI 기능 및 앱 설정
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 🌓 Theme Selector */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            화면 테마 설정 (다크 모드)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'light'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>라이트</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>다크</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                theme === 'system'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>시스템</span>
            </button>
          </div>
        </div>

        {/* Gemini API Key Config */}
        <form onSubmit={handleSaveKey} className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Google Gemini Vision API Key 설정 (선택)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            실제 안내문 사진 OCR 및 AI 상세 분석을 위해 Gemini API Key를 입력할 수 있습니다. 입력하지 않아도 기본 OCR 모드로 작동합니다.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              저장
            </button>
          </div>
          {saveStatus && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveStatus}
            </p>
          )}
        </form>

        {/* PWA App Installation Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                스마트폰 / PC 앱으로 설치 (PWA)
              </span>
            </div>
            {isInstalled && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                설치됨
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
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
            className="px-5 py-2 bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
