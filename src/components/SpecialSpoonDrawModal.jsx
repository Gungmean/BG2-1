import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { X, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { CLASS_STUDENTS } from './DrawPageView';

// Web Audio API for interactive sound effects
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

const playSound = (type = 'pull') => {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'pull') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(380, now);
      osc1.frequency.exponentialRampToValueAtTime(950, now + 0.18);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1100, now);
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.22);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } else if (type === 'reveal') {
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.12, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.55);
      });
    }
  } catch (e) {
    // Ignore audio errors
  }
};

// Spoons in Can 1 (Tens digit)
const TENS_SPOONS = [
  { id: 0, angle: -18, height: 130, left: '16%' },
  { id: 1, angle: -9, height: 145, left: '33%' },
  { id: 2, angle: 0, height: 155, left: '50%' },
  { id: 3, angle: 9, height: 145, left: '67%' },
  { id: 4, angle: 18, height: 130, left: '84%' },
];

// Spoons in Can 2 (Ones digit)
const ONES_SPOONS = [
  { id: 0, angle: -22, height: 130, left: '14%' },
  { id: 1, angle: -15, height: 142, left: '26%' },
  { id: 2, angle: -7, height: 152, left: '38%' },
  { id: 3, angle: 0, height: 158, left: '50%' },
  { id: 4, angle: 7, height: 152, left: '62%' },
  { id: 5, angle: 15, height: 142, left: '74%' },
  { id: 6, angle: 22, height: 130, left: '86%' },
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

  const [pickedTensId, setPickedTensId] = useState(null);
  const [pickedOnesId, setPickedOnesId] = useState(null);
  const [isTensRevealed, setIsTensRevealed] = useState(false);
  const [isOnesRevealed, setIsOnesRevealed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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

    const winner = pool[Math.floor(Math.random() * pool.length)];
    const numStr = String(winner.number).padStart(2, '0');

    setCurrentWinner(winner);
    setTensDigit(numStr[0]);
    setOnesDigit(numStr[1]);

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

  const handlePickTens = (spoonId) => {
    if (isTensRevealed || pickedTensId !== null) return;
    playSound('pull');
    setPickedTensId(spoonId);

    setTimeout(() => {
      setIsTensRevealed(true);
      checkDone(true, isOnesRevealed);
    }, 400);
  };

  const handlePickOnes = (spoonId) => {
    if (isOnesRevealed || pickedOnesId !== null) return;
    playSound('pull');
    setPickedOnesId(spoonId);

    setTimeout(() => {
      setIsOnesRevealed(true);
      checkDone(isTensRevealed, true);
    }, 400);
  };

  const checkDone = (tensDone, onesDone) => {
    if (tensDone && onesDone) {
      setTimeout(() => {
        setIsCompleted(true);
        playSound('reveal');

        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.35 },
          zIndex: 9999
        });

        if (currentWinner && onDrawWinner) {
          onDrawWinner(currentWinner);
        }
      }, 450);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md select-none flex flex-col justify-between"
      >
        {/* Soft Ambient Spotlight Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Minimal Top Header Bar */}
        <div className="relative z-30 w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shadow-md">
              🥄
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  추억의 숟가락 뽑기
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  특별 연출
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                아래 깡통에 꽂힌 숟가락을 클릭하여 뽑아주세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>닫기</span>
            </button>
          </div>
        </div>

        {/* UPPER STAGE: Giant Revealed Spoons ("뽑으면 숫가락을 각각 크게 표시") */}
        <div className="relative z-30 flex flex-col items-center justify-start max-w-4xl mx-auto w-full px-4">
          {/* Status Instruction Badge */}
          <div className="mb-2 sm:mb-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-extrabold text-amber-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {isCompleted
                ? '🎉 축하합니다! 당첨자가 결정되었습니다!'
                : isTensRevealed || isOnesRevealed
                ? '나머지 깡통에서도 숟가락을 뽑아주세요!'
                : '👇 아래 두 깡통에서 숟가락을 하나씩 눌러 뽑으세요!'}
            </span>
          </div>

          {/* TWO GIANT REVEALED SPOONS DISPLAY */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-16">
            {/* GIANT SPOON 1: 십의 자리 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] sm:text-xs font-black text-indigo-300 tracking-wider">
                [ 십의 자리 ]
              </span>

              {isTensRevealed ? (
                <motion.div
                  initial={{ scale: 0.3, y: 60, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                  className="flex flex-col items-center select-none"
                >
                  {/* Giant Spoon Bowl Head */}
                  <div className="w-20 h-28 sm:w-26 sm:h-36 md:w-30 md:h-40 rounded-t-[50%] rounded-b-[40%] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border-3 border-white shadow-[0_8px_30px_rgba(99,102,241,0.6)] flex flex-col items-center justify-center relative overflow-hidden ring-4 ring-indigo-400/50">
                    <div className="absolute top-1.5 left-2 w-2 h-12 bg-white/80 rounded-full blur-[0.5px]" />
                    <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono text-slate-900 drop-shadow-md z-10">
                      {tensDigit}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black text-indigo-700 uppercase tracking-widest z-10">
                      TENS
                    </span>
                  </div>
                  {/* Spoon Handle */}
                  <div className="w-4 h-12 sm:w-5 sm:h-16 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-lg shadow-md border-x border-slate-300/80 -mt-1.5" />
                </motion.div>
              ) : (
                <div className="w-20 h-36 sm:w-26 sm:h-46 md:w-30 md:h-50 rounded-2xl border-2 border-dashed border-indigo-400/50 bg-indigo-950/30 flex flex-col items-center justify-center text-indigo-300/60">
                  <span className="text-3xl sm:text-4xl mb-1 opacity-60">🥄</span>
                  <span className="text-[11px] font-black">십의 자리</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">깡통 1 클릭</span>
                </div>
              )}
            </div>

            <span className="text-2xl sm:text-4xl font-black text-slate-600 mb-8 sm:mb-12">
              +
            </span>

            {/* GIANT SPOON 2: 일의 자리 */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] sm:text-xs font-black text-amber-300 tracking-wider">
                [ 일의 자리 ]
              </span>

              {isOnesRevealed ? (
                <motion.div
                  initial={{ scale: 0.3, y: 60, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                  className="flex flex-col items-center select-none"
                >
                  {/* Giant Spoon Bowl Head */}
                  <div className="w-20 h-28 sm:w-26 sm:h-36 md:w-30 md:h-40 rounded-t-[50%] rounded-b-[40%] bg-gradient-to-b from-amber-50 via-amber-100 to-orange-300 border-3 border-amber-100 shadow-[0_8px_30px_rgba(245,158,11,0.6)] flex flex-col items-center justify-center relative overflow-hidden ring-4 ring-amber-400/50">
                    <div className="absolute top-1.5 left-2 w-2 h-12 bg-white/90 rounded-full blur-[0.5px]" />
                    <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono text-slate-900 drop-shadow-md z-10">
                      {onesDigit}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-widest z-10">
                      ONES
                    </span>
                  </div>
                  {/* Spoon Handle */}
                  <div className="w-4 h-12 sm:w-5 sm:h-16 bg-gradient-to-b from-orange-300 via-amber-400 to-amber-500 rounded-b-lg shadow-md border-x border-amber-200/80 -mt-1.5" />
                </motion.div>
              ) : (
                <div className="w-20 h-36 sm:w-26 sm:h-46 md:w-30 md:h-50 rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-950/30 flex flex-col items-center justify-center text-amber-300/60">
                  <span className="text-3xl sm:text-4xl mb-1 opacity-60">🥄</span>
                  <span className="text-[11px] font-black">일의 자리</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">깡통 2 클릭</span>
                </div>
              )}
            </div>
          </div>

          {/* Winner Celebration Card (When both are revealed) */}
          <AnimatePresence>
            {isCompleted && currentWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="w-full max-w-sm p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/50 border-2 border-amber-300 text-center relative overflow-hidden mt-3 z-40"
              >
                <div className="relative z-10 flex flex-col items-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-[10px] font-black text-amber-200">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>부광고 2-1 당첨!</span>
                  </div>

                  <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-md py-0.5">
                    <span className="font-mono">{currentWinner.number}번</span>{' '}
                    <span>{currentWinner.name}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 w-full">
                    <button
                      type="button"
                      onClick={startNewRound}
                      className="flex-1 py-2 px-3 rounded-xl bg-white text-slate-900 font-extrabold text-xs hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>다시 뽑기</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2 px-3.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-extrabold text-xs active:scale-95 transition-all cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================================================== */}
        {/* LOWER AREA: TWO GIANT TIN CANS ANCHORED TO SCREEN BOTTOM  */}
        {/* "깡통의 아래쪽이 화면 아래쪽 밖으로 나가도록" (확실하게 보임)     */}
        {/* ======================================================== */}
        <motion.div
          initial={{ y: 140, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="relative w-full z-20 flex items-end justify-center gap-6 sm:gap-12 md:gap-20 pointer-events-auto pb-0 -mb-8 sm:-mb-12 md:-mb-14"
        >
          {/* GIANT CAN 1: 십의 자리 깡통 */}
          <div className="relative w-40 sm:w-56 md:w-68 flex flex-col items-center justify-end select-none">
            {/* Spoons protruding from the giant can rim */}
            <div className="relative w-full h-32 sm:h-40 md:h-44 pointer-events-auto z-10">
              {TENS_SPOONS.map((spoon) => {
                const isPicked = pickedTensId === spoon.id;
                const isLocked = isTensRevealed || pickedTensId !== null;

                return (
                  <motion.div
                    key={spoon.id}
                    initial={false}
                    animate={
                      isPicked
                        ? { y: -220, scale: 1.25, opacity: [1, 1, 0] }
                        : isLocked
                        ? { opacity: 0.25 }
                        : { y: 0, opacity: 1 }
                    }
                    whileHover={
                      !isLocked
                        ? {
                            y: -22,
                            scale: 1.12,
                            transition: { duration: 0.15 }
                          }
                        : {}
                    }
                    onClick={() => handlePickTens(spoon.id)}
                    onMouseEnter={() => !isLocked && playSound('hover')}
                    style={{
                      position: 'absolute',
                      left: spoon.left,
                      bottom: 0,
                      transformOrigin: 'bottom center',
                      rotate: isPicked ? '0deg' : `${spoon.angle}deg`,
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                    className="group flex flex-col items-center"
                  >
                    {/* Spoon Oval Head */}
                    <div className="w-8 h-13 sm:w-10 sm:h-16 md:w-12 md:h-18 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-xl group-hover:shadow-indigo-400/80 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                      <div className="absolute top-1 left-1.5 w-1.5 h-7 bg-white/80 rounded-full blur-[0.5px]" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-700 font-mono">
                        {isPicked && isTensRevealed ? tensDigit : '?'}
                      </span>
                    </div>
                    {/* Spoon Neck */}
                    <div className="w-3 h-18 sm:w-3.5 sm:h-24 md:w-4 md:h-28 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                  </motion.div>
                );
              })}
            </div>

            {/* Giant Tin Can Body (Extends slightly off-screen at bottom) */}
            <div className="relative z-20 w-full h-44 sm:h-56 md:h-64 rounded-t-3xl bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 border-t-4 border-x-4 border-slate-300 shadow-[0_-12px_35px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-3 sm:p-4 overflow-hidden">
              {/* Can Top Opening Oval Rim */}
              <div className="w-full h-8 sm:h-10 rounded-[50%] bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-400 shadow-inner flex items-center justify-center shrink-0">
                <div className="w-[88%] h-4 sm:h-5 rounded-[50%] bg-black/90 blur-[1px]" />
              </div>

              {/* Big Front Can Label */}
              <div className="my-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-indigo-700/95 text-white border-2 border-indigo-300 shadow-xl text-center w-full max-w-[200px]">
                <span className="block text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-indigo-200">
                  TENS DIGIT CAN
                </span>
                <span className="text-xs sm:text-base md:text-lg font-black font-mono block">
                  깡통 1: 십의 자리
                </span>
                <span className="block text-[9px] sm:text-[10px] text-indigo-200 font-bold mt-0.5">
                  {isTensRevealed ? '✅ 뽑기 완료' : '👆 숟가락 클릭'}
                </span>
              </div>

              {/* Embossed Metallic Rib Lines */}
              <div className="w-full space-y-1.5 opacity-50 pb-4">
                <div className="w-full h-1 bg-slate-200" />
                <div className="w-full h-1 bg-slate-950" />
                <div className="w-full h-1 bg-slate-200" />
              </div>
            </div>
          </div>

          {/* GIANT CAN 2: 일의 자리 깡통 */}
          <div className="relative w-40 sm:w-56 md:w-68 flex flex-col items-center justify-end select-none">
            {/* Spoons protruding from the giant can rim */}
            <div className="relative w-full h-32 sm:h-40 md:h-44 pointer-events-auto z-10">
              {ONES_SPOONS.map((spoon) => {
                const isPicked = pickedOnesId === spoon.id;
                const isLocked = isOnesRevealed || pickedOnesId !== null;

                return (
                  <motion.div
                    key={spoon.id}
                    initial={false}
                    animate={
                      isPicked
                        ? { y: -220, scale: 1.25, opacity: [1, 1, 0] }
                        : isLocked
                        ? { opacity: 0.25 }
                        : { y: 0, opacity: 1 }
                    }
                    whileHover={
                      !isLocked
                        ? {
                            y: -22,
                            scale: 1.12,
                            transition: { duration: 0.15 }
                          }
                        : {}
                    }
                    onClick={() => handlePickOnes(spoon.id)}
                    onMouseEnter={() => !isLocked && playSound('hover')}
                    style={{
                      position: 'absolute',
                      left: spoon.left,
                      bottom: 0,
                      transformOrigin: 'bottom center',
                      rotate: isPicked ? '0deg' : `${spoon.angle}deg`,
                      cursor: isLocked ? 'default' : 'pointer'
                    }}
                    className="group flex flex-col items-center"
                  >
                    {/* Spoon Oval Head */}
                    <div className="w-8 h-13 sm:w-10 sm:h-16 md:w-12 md:h-18 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-xl group-hover:shadow-amber-400/80 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                      <div className="absolute top-1 left-1.5 w-1.5 h-7 bg-white/80 rounded-full blur-[0.5px]" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-700 font-mono">
                        {isPicked && isOnesRevealed ? onesDigit : '?'}
                      </span>
                    </div>
                    {/* Spoon Neck */}
                    <div className="w-3 h-18 sm:w-3.5 sm:h-24 md:w-4 md:h-28 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                  </motion.div>
                );
              })}
            </div>

            {/* Giant Tin Can Body (Extends slightly off-screen at bottom) */}
            <div className="relative z-20 w-full h-44 sm:h-56 md:h-64 rounded-t-3xl bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 border-t-4 border-x-4 border-slate-300 shadow-[0_-12px_35px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-3 sm:p-4 overflow-hidden">
              {/* Can Top Opening Oval Rim */}
              <div className="w-full h-8 sm:h-10 rounded-[50%] bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-400 shadow-inner flex items-center justify-center shrink-0">
                <div className="w-[88%] h-4 sm:h-5 rounded-[50%] bg-black/90 blur-[1px]" />
              </div>

              {/* Big Front Can Label */}
              <div className="my-auto px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-amber-600/95 text-white border-2 border-amber-300 shadow-xl text-center w-full max-w-[200px]">
                <span className="block text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-amber-100">
                  ONES DIGIT CAN
                </span>
                <span className="text-xs sm:text-base md:text-lg font-black font-mono block">
                  깡통 2: 일의 자리
                </span>
                <span className="block text-[9px] sm:text-[10px] text-amber-100 font-bold mt-0.5">
                  {isOnesRevealed ? '✅ 뽑기 완료' : '👆 숟가락 클릭'}
                </span>
              </div>

              {/* Embossed Metallic Rib Lines */}
              <div className="w-full space-y-1.5 opacity-50 pb-4">
                <div className="w-full h-1 bg-slate-200" />
                <div className="w-full h-1 bg-slate-950" />
                <div className="w-full h-1 bg-slate-200" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
