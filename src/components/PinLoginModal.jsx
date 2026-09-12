import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { hasMonitorPin, setMonitorPin, verifyMonitorPin, resetMonitorPin } from '../services/storageService';

export default function PinLoginModal({ isOpen, onClose, isMonitor, setIsMonitor }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isPinReady, setIsPinReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsPinReady(hasMonitorPin());
      setPin('');
      setConfirmPin('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (pin.length < 4) {
      setError('비밀번호는 4자리 이상으로 설정해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!isPinReady) {
        if (pin !== confirmPin) {
          setError('확인 비밀번호가 일치하지 않습니다.');
          return;
        }

        await setMonitorPin(pin);
        setIsPinReady(true);
        setIsMonitor(true);
        setPin('');
        setConfirmPin('');
        onClose();
      } else {
        const isValidPin = await verifyMonitorPin(pin);
        if (isValidPin) {
          setIsMonitor(true);
          setPin('');
          onClose();
        } else {
          setError('비밀번호가 올바르지 않습니다.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('처리 중 오류가 발생했습니다: ' + (err?.message || '잠시 후 다시 시도해주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPin = () => {
    if (window.confirm('기존 반장 비밀번호를 초기화하고 새로 설정하시겠습니까?')) {
      resetMonitorPin();
      setIsPinReady(false);
      setPin('');
      setConfirmPin('');
      setError('비밀번호가 초기화되었습니다. 새로운 비밀번호를 설정해주세요.');
    }
  };

  const handleLogout = () => {
    setIsMonitor(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Crown className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                👑 학급 반장 인증
              </h2>
              <p className="text-xs text-slate-500">
                게시물 작성, AI 스캔, 수정 및 삭제 권한을 관리합니다.
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

        {isMonitor ? (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold space-y-1">
              <p className="text-sm font-bold text-amber-800">
                ✨ 현재 반장 권한이 활성화되어 있습니다.
              </p>
              <p className="text-amber-700">
                사진으로 게시물 등록(AI), 편집 및 삭제가 가능합니다.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              일반 학생 모드로 전환 (로그아웃)
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isPinReady ? '🔒 반장 인증 비밀번호' : '🔒 사용할 반장 비밀번호 설정'}
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder={isPinReady ? '비밀번호 입력' : '새 비밀번호 입력'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                autoFocus
              />
              {!isPinReady && (
                <input
                  type="password"
                  maxLength={8}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setError('');
                  }}
                  placeholder="새 비밀번호 한 번 더 입력"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              )}
              {error && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">💡 안내:</p>
              <p>• 처음 인증하는 기기에서 사용할 반장 비밀번호를 설정합니다.</p>
              <p>• 반장만 AI 사진 스캔 등록 및 수정/삭제가 가능합니다.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-md shadow-amber-200 flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? '처리 중...' : isPinReady ? '반장 로그인' : '비밀번호 설정'}</span>
              </button>
            </div>

            {isPinReady && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleResetPin}
                  className="text-[11px] text-slate-400 hover:text-rose-500 underline transition-colors"
                >
                  비밀번호를 재설정하시겠습니까? (초기화)
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
