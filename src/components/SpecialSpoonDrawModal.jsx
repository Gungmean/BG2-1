import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { X, RotateCcw, Sparkles, Trophy, CheckCircle2, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { CLASS_STUDENTS } from './DrawPageView';

// Audio Context for spoon drawing sounds
let audioCtx = null;
const getAudio = () => {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
};

const playSpoonSound = (type = 'pull') => {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'hover') {
      // Light metallic tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'pull') {
      // Metallic swoosh & clink
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, now);
      osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === 'reveal') {
      // Suspense fanfare chord
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.6);
      });
    }
  } catch (e) {
    // Ignore audio errors
  }
};

// Spoons configuration for Can 1 (Tens digit)
const TENS_SPOONS_CONFIG = [
  { id: 0, angle: -18, height: 110, offsetLeft: '18%' },
  { id: 1, angle: -9, height: 125, offsetLeft: '34%' },
  { id: 2, angle: 0, height: 132, offsetLeft: '50%' },
  { id: 3, angle: 9, height: 124, offsetLeft: '66%' },
  { id: 4, angle: 18, height: 112, offsetLeft: '82%' },
];

// Spoons configuration for Can 2 (Ones digit)
const ONES_SPOONS_CONFIG = [
  { id: 0, angle: -24, height: 112, offsetLeft: '14%' },
  { id: 1, angle: -16, height: 120, offsetLeft: '26%' },
  { id: 2, angle: -8, height: 128, offsetLeft: '38%' },
  { id: 3, angle: 0, height: 134, offsetLeft: '50%' },
  { id: 4, angle: 8, height: 128, offsetLeft: '62%' },
  { id: 5, angle: 16, height: 120, offsetLeft: '74%' },
  { id: 6, angle: 24, height: 112, offsetLeft: '86%' },
];

export default function SpecialSpoonDrawModal({
  isOpen,
  onClose,
  remainingPool = CLASS_STUDENTS,
  allowDuplicate = false,
  onDrawWinner,
  onResetPool
}) {
  const [currentWinner, setCurrentWinner] = useState(null);
  const [tensDigit, setTensDigit] = useState('0');
  const [onesDigit, setOnesDigit] = useState('0');

  // Spoon pick states
  const [pickedTensId, setPickedTensId] = useState(null);
  const [pickedOnesId, setPickedOnesId] = useState(null);
  const [isTensRevealed, setIsTensRevealed] = useState(false);
  const [isOnesRevealed, setIsOnesRevealed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [roundCount, setRoundCount] = useState(1);

  // Initialize or reset a round
  const startNewRound = () => {
    let pool = allowDuplicate ? CLASS_STUDENTS : remainingPool;
    if (pool.length === 0) {
      if (window.confirm('모든 학생이 추첨되었습니다! 명단을 초기화하여 다시 추첨하시겠습니까?')) {
        if (onResetPool) onResetPool();
        pool = [...CLASS_STUDENTS];
      } else {
        return;
      }
    }

    // Pick random target winner for this round
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const numStr = String(winner.number).padStart(2, '0');

    setCurrentWinner(winner);
    setTensDigit(numStr[0]);
    setOnesDigit(numStr[1]);

    // Reset interaction states
    setPickedTensId(null);
    setPickedOnesId(null);
    setIsTensRevealed(false);
    setIsOnesRevealed(false);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isOpen) {
      startNewRound();
    }
  }, [isOpen]);

  // Handle picking a spoon from Can 1 (Tens digit)
  const handlePickTensSpoon = (spoonId) => {
    if (isTensRevealed || pickedTensId !== null) return;
    playSpoonSound('pull');
    setPickedTensId(spoonId);

    setTimeout(() => {
      setIsTensRevealed(true);
      checkCompletion(true, isOnesRevealed);
    }, 450);
  };

  // Handle picking a spoon from Can 2 (Ones digit)
  const handlePickOnesSpoon = (spoonId) => {
    if (isOnesRevealed || pickedOnesId !== null) return;
    playSpoonSound('pull');
    setPickedOnesId(spoonId);

    setTimeout(() => {
      setIsOnesRevealed(true);
      checkCompletion(isTensRevealed, true);
    }, 450);
  };

  // Check if both spoons are revealed
  const checkCompletion = (tensDone, onesDone) => {
    if (tensDone && onesDone) {
      setTimeout(() => {
        setIsCompleted(true);
        playSpoonSound('reveal');

        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
          zIndex: 9999
        });

        // Trigger log recording & pool removal in parent
        if (currentWinner && onDrawWinner) {
          onDrawWinner(currentWinner);
        }
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8"
      >
        {/* Ambient Stage Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 w-full flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              🥄
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  추억의 숟가락 뽑기
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold">
                  특별 연출
                </span>
              </div>
              <p className="text-xs text-slate-400">
                부광고 2-1 • 십의 자리 깡통과 일의 자리 깡통에서 숟가락을 하나씩 뽑으세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-400">
              <span>남은 대상:</span>
              <strong className="text-amber-400 font-bold">{remainingPool.length}명</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stage: Results Rack & Tin Cans */}
        <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-8 sm:space-y-12">
          {/* Top Display: Selected Spoons Dock */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                {isCompleted
                  ? '🎉 당첨 번호가 완성되었습니다!'
                  : isTensRevealed || isOnesRevealed
                  ? '나머지 숟가락도 뽑아주세요!'
                  : '원하는 숟가락을 클릭하여 뽑아보세요!'}
              </span>
            </div>

            {/* Revealed Spoon Heads Pair */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Tens Digit Slot */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-300">십의 자리</span>
                <motion.div
                  animate={
                    isTensRevealed
                      ? { scale: [0.8, 1.15, 1], y: [10, -5, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className={`w-20 h-28 sm:w-24 sm:h-32 rounded-3xl flex flex-col items-center justify-center border-2 transition-all shadow-xl relative overflow-hidden ${
                    isTensRevealed
                      ? 'bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 border-indigo-300 text-white shadow-indigo-500/40 ring-4 ring-indigo-400/30'
                      : 'bg-slate-900/80 border-dashed border-indigo-400/40 text-indigo-300/40'
                  }`}
                >
                  {isTensRevealed ? (
                    <>
                      {/* Metallic Spoon Texture Lines */}
                      <div className="absolute top-2 w-10 h-1 bg-white/30 rounded-full" />
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter drop-shadow-md">
                        {tensDigit}
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-200 mt-1 uppercase">
                        SPOON
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl opacity-60">🥄</span>
                      <span className="text-[10px] font-bold">미선택</span>
                    </div>
                  )}
                </motion.div>
              </div>

              <span className="text-2xl sm:text-3xl font-black text-slate-600 mb-6">+</span>

              {/* Ones Digit Slot */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300">일의 자리</span>
                <motion.div
                  animate={
                    isOnesRevealed
                      ? { scale: [0.8, 1.15, 1], y: [10, -5, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className={`w-20 h-28 sm:w-24 sm:h-32 rounded-3xl flex flex-col items-center justify-center border-2 transition-all shadow-xl relative overflow-hidden ${
                    isOnesRevealed
                      ? 'bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 border-amber-200 text-white shadow-amber-500/40 ring-4 ring-amber-400/30'
                      : 'bg-slate-900/80 border-dashed border-amber-400/40 text-amber-300/40'
                  }`}
                >
                  {isOnesRevealed ? (
                    <>
                      {/* Metallic Spoon Texture Lines */}
                      <div className="absolute top-2 w-10 h-1 bg-white/30 rounded-full" />
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter drop-shadow-md">
                        {onesDigit}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-100 mt-1 uppercase">
                        SPOON
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl opacity-60">🥄</span>
                      <span className="text-[10px] font-bold">미선택</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Celebration Winner Banner (Appears when both are revealed) */}
          <AnimatePresence>
            {isCompleted && currentWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/40 border-2 border-amber-300 text-center relative overflow-hidden"
              >
                {/* Shiny diagonal overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm text-xs font-black text-amber-200">
                    <Trophy className="w-4 h-4 text-amber-300" />
                    <span>부광고 2학년 1반 당첨!</span>
                  </div>

                  <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg py-1">
                    <span className="font-mono">{currentWinner.number}번</span>{' '}
                    <span>{currentWinner.name}</span>
                  </div>

                  <p className="text-xs text-amber-100 font-medium">
                    축하합니다! 숟가락 뽑기에서 행운의 번호로 선정되었습니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Cans Area (Two Tin Cans with Spoons) */}
          <div className="grid grid-cols-2 gap-6 sm:gap-14 w-full max-w-2xl px-2">
            {/* CAN 1: 십의 자리 깡통 */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-black text-xs sm:text-sm">
                  깡통 1: 십의 자리
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isTensRevealed ? '✅ 뽑기 완료' : '숟가락을 클릭해 뽑으세요'}
                </p>
              </div>

              {/* Can Container with Spoons */}
              <div className="relative w-36 h-48 sm:w-48 sm:h-56 flex flex-col items-center justify-end">
                {/* Spoons protruding from the can */}
                <div className="absolute top-0 inset-x-0 h-32 pointer-events-auto">
                  {TENS_SPOONS_CONFIG.map((spoon) => {
                    const isPicked = pickedTensId === spoon.id;
                    const isAnyPicked = isTensRevealed || pickedTensId !== null;

                    return (
                      <motion.div
                        key={spoon.id}
                        initial={false}
                        animate={
                          isPicked
                            ? {
                                y: -160,
                                scale: 1.25,
                                rotate: 0,
                                opacity: [1, 1, 0.4]
                              }
                            : isAnyPicked
                            ? { opacity: 0.35 }
                            : { y: 0, opacity: 1 }
                        }
                        whileHover={
                          !isAnyPicked
                            ? {
                                y: -16,
                                scale: 1.08,
                                transition: { duration: 0.15 }
                              }
                            : {}
                        }
                        onClick={() => handlePickTensSpoon(spoon.id)}
                        onMouseEnter={() => !isAnyPicked && playSpoonSound('hover')}
                        style={{
                          position: 'absolute',
                          left: spoon.offsetLeft,
                          bottom: 0,
                          transformOrigin: 'bottom center',
                          rotate: isPicked ? '0deg' : `${spoon.angle}deg`,
                          cursor: isAnyPicked ? 'default' : 'pointer'
                        }}
                        className="group flex flex-col items-center select-none"
                      >
                        {/* Spoon Oval Head / Handle sticking out */}
                        <div className="w-7 h-10 sm:w-9 sm:h-13 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border border-slate-100 shadow-md group-hover:shadow-indigo-400/50 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                          {/* Chrome shine effect */}
                          <div className="absolute top-1 left-1.5 w-1.5 h-6 bg-white/70 rounded-full blur-[0.5px]" />
                          <span className="text-[10px] sm:text-xs font-black text-slate-700 font-mono">
                            {isPicked && isTensRevealed ? tensDigit : '?'}
                          </span>
                        </div>
                        {/* Spoon Neck */}
                        <div className="w-2.5 h-16 sm:w-3.5 sm:h-20 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* 3D Realistic Tin Can Body */}
                <div className="relative z-20 w-full h-32 sm:h-38 rounded-3xl bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700 border-2 border-slate-300 shadow-2xl flex flex-col items-center justify-between p-3 overflow-hidden">
                  {/* Can Top Opening Oval Rim */}
                  <div className="w-full h-7 rounded-[50%] bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-[85%] h-3 rounded-[50%] bg-black/80 blur-[1px]" />
                  </div>

                  {/* Can Vintage Label */}
                  <div className="my-auto px-3 py-1.5 rounded-xl bg-indigo-700 text-white border border-indigo-400/60 shadow-md text-center">
                    <span className="block text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase text-indigo-200">
                      TENS DIGIT
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono">
                      십의 자리
                    </span>
                  </div>

                  {/* Can Ribbed Ridges (Metallic texture lines) */}
                  <div className="w-full space-y-1 opacity-40">
                    <div className="w-full h-0.5 bg-slate-200" />
                    <div className="w-full h-0.5 bg-slate-900" />
                  </div>
                </div>

                {/* Ground Shadow */}
                <div className="absolute -bottom-2 w-32 sm:w-40 h-4 bg-black/60 rounded-full blur-md" />
              </div>
            </div>

            {/* CAN 2: 일의 자리 깡통 */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300 font-black text-xs sm:text-sm">
                  깡통 2: 일의 자리
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isOnesRevealed ? '✅ 뽑기 완료' : '숟가락을 클릭해 뽑으세요'}
                </p>
              </div>

              {/* Can Container with Spoons */}
              <div className="relative w-36 h-48 sm:w-48 sm:h-56 flex flex-col items-center justify-end">
                {/* Spoons protruding from the can */}
                <div className="absolute top-0 inset-x-0 h-32 pointer-events-auto">
                  {ONES_SPOONS_CONFIG.map((spoon) => {
                    const isPicked = pickedOnesId === spoon.id;
                    const isAnyPicked = isOnesRevealed || pickedOnesId !== null;

                    return (
                      <motion.div
                        key={spoon.id}
                        initial={false}
                        animate={
                          isPicked
                            ? {
                                y: -160,
                                scale: 1.25,
                                rotate: 0,
                                opacity: [1, 1, 0.4]
                              }
                            : isAnyPicked
                            ? { opacity: 0.35 }
                            : { y: 0, opacity: 1 }
                        }
                        whileHover={
                          !isAnyPicked
                            ? {
                                y: -16,
                                scale: 1.08,
                                transition: { duration: 0.15 }
                              }
                            : {}
                        }
                        onClick={() => handlePickOnesSpoon(spoon.id)}
                        onMouseEnter={() => !isAnyPicked && playSpoonSound('hover')}
                        style={{
                          position: 'absolute',
                          left: spoon.offsetLeft,
                          bottom: 0,
                          transformOrigin: 'bottom center',
                          rotate: isPicked ? '0deg' : `${spoon.angle}deg`,
                          cursor: isAnyPicked ? 'default' : 'pointer'
                        }}
                        className="group flex flex-col items-center select-none"
                      >
                        {/* Spoon Oval Head / Handle sticking out */}
                        <div className="w-7 h-10 sm:w-9 sm:h-13 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border border-slate-100 shadow-md group-hover:shadow-amber-400/50 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                          {/* Chrome shine effect */}
                          <div className="absolute top-1 left-1.5 w-1.5 h-6 bg-white/70 rounded-full blur-[0.5px]" />
                          <span className="text-[10px] sm:text-xs font-black text-slate-700 font-mono">
                            {isPicked && isOnesRevealed ? onesDigit : '?'}
                          </span>
                        </div>
                        {/* Spoon Neck */}
                        <div className="w-2.5 h-16 sm:w-3.5 sm:h-20 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* 3D Realistic Tin Can Body */}
                <div className="relative z-20 w-full h-32 sm:h-38 rounded-3xl bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700 border-2 border-slate-300 shadow-2xl flex flex-col items-center justify-between p-3 overflow-hidden">
                  {/* Can Top Opening Oval Rim */}
                  <div className="w-full h-7 rounded-[50%] bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-[85%] h-3 rounded-[50%] bg-black/80 blur-[1px]" />
                  </div>

                  {/* Can Vintage Label */}
                  <div className="my-auto px-3 py-1.5 rounded-xl bg-amber-600 text-white border border-amber-300/60 shadow-md text-center">
                    <span className="block text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase text-amber-100">
                      ONES DIGIT
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono">
                      일의 자리
                    </span>
                  </div>

                  {/* Can Ribbed Ridges (Metallic texture lines) */}
                  <div className="w-full space-y-1 opacity-40">
                    <div className="w-full h-0.5 bg-slate-200" />
                    <div className="w-full h-0.5 bg-slate-900" />
                  </div>
                </div>

                {/* Ground Shadow */}
                <div className="absolute -bottom-2 w-32 sm:w-40 h-4 bg-black/60 rounded-full blur-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-center gap-3 pt-2">
          {isCompleted ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startNewRound}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-5 h-5" />
              <span>다음 학생 뽑기 (새 숟가락)</span>
            </motion.button>
          ) : (
            <p className="text-xs text-slate-400 text-center font-medium">
              💡 깡통에 꽂힌 숟가락 중 마음에 드는 것을 하나씩 눌러보세요!
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
