import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle, X, ShieldCheck, Lock, LogOut } from 'lucide-react';
import { verifyMonitorPin } from '../services/storageService';

export default function PinLoginModal({ isOpen, onClose, isMonitor, setIsMonitor }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (lockoutTimer > 0) {
      setError(`보안을 위해 ${lockoutTimer}초 후에 다시 시도할 수 있습니다.`);
      return;
    }

    if (!pin || pin.trim().length === 0) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isValid = await verifyMonitorPin(pin.trim());
      if (isValid) {
        setFailedAttempts(0);
        setIsMonitor(true);
        setPin('');
        onClose();
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 5) {
          setLockoutTimer(30);
          setError('비밀번호를 5회 연속 잘못 입력하여 30초간 입력이 제한됩니다.');
        } else {
          setError(`비밀번호가 올바르지 않습니다. (오류 ${nextFailed}/5회)`);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('인증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsMonitor(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                👑 학급 반장 인증
              </h2>
              <p className="text-xs text-slate-500">
                인천 부광고 2학년 1반 관리자 권한
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
              <p className="text-sm font-bold text-amber-800 flex items-center justify-center gap-1.5">
                <Crown className="w-4 h-4 fill-amber-500" /> 반장 권한 활성화 중
              </p>
              <p className="text-amber-700">
                안내문 AI 등록, 공지 수정 및 삭제가 가능합니다.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>학생 모드로 전환 (로그아웃)</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" /> 반장 비밀번호 입력
                </span>
                {lockoutTimer > 0 && (
                  <span className="text-rose-500 font-bold text-[11px]">
                    {lockoutTimer}초 제한 중
                  </span>
                )}
              </label>
              <input
                type="password"
                maxLength={12}
                disabled={lockoutTimer > 0 || isSubmitting}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 disabled:opacity-50"
                autoFocus
              />
              {error && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">💡 보안 안내:</p>
              <p>• 사전에 지정된 반장 고유 비밀번호로만 인증됩니다.</p>
              <p>• 5회 이상 연속 오류 시 일시적으로 로그인이 제한됩니다.</p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || lockoutTimer > 0}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-md shadow-amber-200 flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? '확인 중...' : '인증하기'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
