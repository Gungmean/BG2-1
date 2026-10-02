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
  { id: 0, angle: -18, height: 140, left: '16%' },
  { id: 1, angle: -9, height: 160, left: '33%' },
  { id: 2, angle: 0, height: 170, left: '50%' },
  { id: 3, angle: 9, height: 160, left: '67%' },
  { id: 4, angle: 18, height: 140, left: '84%' },
];

// Spoons in Can 2 (Ones digit)
const ONES_SPOONS = [
  { id: 0, angle: -24, height: 140, left: '14%' },
  { id: 1, angle: -16, height: 155, left: '26%' },
  { id: 2, angle: -8, height: 165, left: '38%' },
  { id: 3, angle: 0, height: 172, left: '50%' },
  { id: 4, angle: 8, height: 165, left: '62%' },
  { id: 5, angle: 16, height: 155, left: '74%' },
  { id: 6, angle: 24, height: 140, left: '86%' },
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
          origin: { y: 0.45 },
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
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md select-none flex flex-col justify-between"
      >
        {/* Soft Ambient Spotlight Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Minimal Top Control Bar */}
        <div className="relative z-30 w-full p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-md">
              🥄
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  추억의 숟가락 뽑기
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  특별 연출
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                아래 깡통에 꽂힌 숟가락을 클릭하여 십의 자리와 일의 자리를 뽑아보세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>닫기</span>
            </button>
          </div>
        </div>

        {/* UPPER STAGE: Giant Revealed Spoons ("뽑으면 숫가락을 각각 크게 표시") */}
        <div className="relative z-30 flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 max-w-4xl mx-auto w-full px-4">
          {/* Status Instruction */}
          <div className="mb-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs sm:text-sm font-extrabold text-amber-300 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              {isCompleted
                ? '🎉 축하합니다! 번호가 완성되었습니다!'
                : isTensRevealed || isOnesRevealed
                ? '나머지 깡통에서도 숟가락을 뽑아주세요!'
                : '아래 두 깡통에서 숟가락을 하나씩 눌러 뽑으세요!'}
            </span>
          </div>

          {/* TWO GIANT REVEALED SPOONS */}
          <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-16 my-2">
            {/* GIANT SPOON 1: 십의 자리 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-indigo-300 tracking-wider">
                [ 십의 자리 ]
              </span>

              {isTensRevealed ? (
                <motion.div
                  initial={{ scale: 0.3, y: 80, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center select-none"
                >
                  {/* Giant Spoon Bowl Head */}
                  <div className="w-24 h-34 sm:w-32 sm:h-44 md:w-38 md:h-52 rounded-t-[50%] rounded-b-[40%] bg-gradient-to-b from-slate-100 via-slate-200 to-slate-400 border-4 border-white shadow-[0_10px_35px_rgba(99,102,241,0.5)] flex flex-col items-center justify-center relative overflow-hidden ring-4 ring-indigo-400/40">
                    {/* Metallic Gloss Highlights */}
                    <div className="absolute top-2 left-3 w-3 h-16 bg-white/80 rounded-full blur-[1px]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-white/20 to-transparent pointer-events-none" />

                    {/* Huge Number */}
                    <span className="text-5xl sm:text-7xl md:text-8xl font-black font-mono text-slate-900 drop-shadow-md z-10">
                      {tensDigit}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-indigo-700 uppercase tracking-widest mt-1 z-10">
                      TENS
                    </span>
                  </div>

                  {/* Giant Spoon Handle */}
                  <div className="w-5 h-20 sm:w-6 sm:h-28 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-xl shadow-lg border-x-2 border-slate-300/80 -mt-2" />
                </motion.div>
              ) : (
                /* Unrevealed Placeholder Outline */
                <div className="w-24 h-48 sm:w-32 sm:h-64 rounded-3xl border-3 border-dashed border-indigo-400/40 bg-indigo-950/30 flex flex-col items-center justify-center text-indigo-300/50">
                  <span className="text-4xl sm:text-5xl mb-2 opacity-50">🥄</span>
                  <span className="text-xs font-black">십의 자리</span>
                  <span className="text-[10px] text-slate-400 mt-1">아래 깡통 1 클릭</span>
                </div>
              )}
            </div>

            <span className="text-3xl sm:text-5xl font-black text-slate-600 mb-14 sm:mb-20">
              +
            </span>

            {/* GIANT SPOON 2: 일의 자리 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wider">
                [ 일의 자리 ]
              </span>

              {isOnesRevealed ? (
                <motion.div
                  initial={{ scale: 0.3, y: 80, rotate: 15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="flex flex-col items-center select-none"
                >
                  {/* Giant Spoon Bowl Head */}
                  <div className="w-24 h-34 sm:w-32 sm:h-44 md:w-38 md:h-52 rounded-t-[50%] rounded-b-[40%] bg-gradient-to-b from-amber-50 via-amber-100 to-orange-300 border-4 border-amber-100 shadow-[0_10px_35px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center relative overflow-hidden ring-4 ring-amber-400/40">
                    {/* Metallic Gloss Highlights */}
                    <div className="absolute top-2 left-3 w-3 h-16 bg-white/90 rounded-full blur-[1px]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-white/20 to-transparent pointer-events-none" />

                    {/* Huge Number */}
                    <span className="text-5xl sm:text-7xl md:text-8xl font-black font-mono text-slate-900 drop-shadow-md z-10">
                      {onesDigit}
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-amber-800 uppercase tracking-widest mt-1 z-10">
                      ONES
                    </span>
                  </div>

                  {/* Giant Spoon Handle */}
                  <div className="w-5 h-20 sm:w-6 sm:h-28 bg-gradient-to-b from-orange-300 via-amber-400 to-amber-500 rounded-b-xl shadow-lg border-x-2 border-amber-200/80 -mt-2" />
                </motion.div>
              ) : (
                /* Unrevealed Placeholder Outline */
                <div className="w-24 h-48 sm:w-32 sm:h-64 rounded-3xl border-3 border-dashed border-amber-400/40 bg-amber-950/30 flex flex-col items-center justify-center text-amber-300/50">
                  <span className="text-4xl sm:text-5xl mb-2 opacity-50">🥄</span>
                  <span className="text-xs font-black">일의 자리</span>
                  <span className="text-[10px] text-slate-400 mt-1">아래 깡통 2 클릭</span>
                </div>
              )}
            </div>
          </div>

          {/* Winner Celebration Card (When both are revealed) */}
          <AnimatePresence>
            {isCompleted && currentWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="w-full max-w-md p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-orange-500/40 border-2 border-amber-300 text-center relative overflow-hidden my-2 z-40"
              >
                <div className="relative z-10 flex flex-col items-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-[11px] font-black text-amber-200">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>부광고 2학년 1반 당첨!</span>
                  </div>

                  <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-md py-0.5">
                    <span className="font-mono">{currentWinner.number}번</span>{' '}
                    <span>{currentWinner.name}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 w-full">
                    <button
                      type="button"
                      onClick={startNewRound}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-white text-slate-900 font-extrabold text-xs sm:text-sm hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>다시 뽑기</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 rounded-xl bg-black/30 hover:bg-black/40 text-white font-extrabold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
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
        {/* LOWER AREA: TWO GIANT TIN CANS ANCHORED TO BOTTOM        */}
        {/* "깡통의 아래쪽이 화면 아래쪽 밖으로 나가도록"                 */}
        {/* ======================================================== */}
        <div className="relative w-full h-44 sm:h-56 md:h-64 pointer-events-none">
          <div className="absolute -bottom-24 sm:-bottom-32 md:-bottom-40 left-0 right-0 flex items-end justify-center gap-8 sm:gap-16 md:gap-24 z-20 pointer-events-auto">
            {/* GIANT CAN 1: 십의 자리 깡통 */}
            <div className="relative w-48 sm:w-64 md:w-80 h-72 sm:h-96 md:h-[420px] flex flex-col items-center justify-end">
              {/* Spoons protruding from the giant can rim */}
              <div className="absolute top-0 inset-x-0 h-44 sm:h-56 pointer-events-auto z-10">
                {TENS_SPOONS.map((spoon) => {
                  const isPicked = pickedTensId === spoon.id;
                  const isLocked = isTensRevealed || pickedTensId !== null;

                  return (
                    <motion.div
                      key={spoon.id}
                      initial={false}
                      animate={
                        isPicked
                          ? { y: -260, scale: 1.3, opacity: [1, 1, 0] }
                          : isLocked
                          ? { opacity: 0.3 }
                          : { y: 0, opacity: 1 }
                      }
                      whileHover={
                        !isLocked
                          ? {
                              y: -24,
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
                      className="group flex flex-col items-center select-none"
                    >
                      {/* Spoon Oval Head / Handle */}
                      <div className="w-8 h-14 sm:w-11 sm:h-18 md:w-13 md:h-22 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-xl group-hover:shadow-indigo-400/80 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                        <div className="absolute top-1 left-1.5 w-1.5 h-8 bg-white/80 rounded-full blur-[0.5px]" />
                        <span className="text-xs sm:text-sm font-black text-slate-700 font-mono">
                          {isPicked && isTensRevealed ? tensDigit : '?'}
                        </span>
                      </div>
                      {/* Spoon Neck */}
                      <div className="w-3.5 h-20 sm:w-4 sm:h-28 md:w-5 md:h-36 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Giant Tin Can Body (Bottom extends off-screen) */}
              <div className="relative z-20 w-full h-56 sm:h-76 md:h-92 rounded-t-3xl bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 border-t-4 border-x-4 border-slate-300 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-4 overflow-hidden">
                {/* Can Top Opening Oval Rim */}
                <div className="w-full h-9 sm:h-12 rounded-[50%] bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-400 shadow-inner flex items-center justify-center shrink-0">
                  <div className="w-[88%] h-4 sm:h-6 rounded-[50%] bg-black/90 blur-[1px]" />
                </div>

                {/* Big Vintage Front Can Label */}
                <div className="my-auto px-4 py-2 sm:py-3 rounded-2xl bg-indigo-700/90 text-white border-2 border-indigo-300 shadow-xl text-center">
                  <span className="block text-[10px] sm:text-xs font-black tracking-widest uppercase text-indigo-200">
                    TENS DIGIT CAN
                  </span>
                  <span className="text-sm sm:text-lg md:text-xl font-black font-mono">
                    깡통 1: 십의 자리
                  </span>
                  <span className="block text-[10px] text-indigo-200/80 font-bold mt-0.5">
                    {isTensRevealed ? '✅ 뽑기 완료' : '숟가락을 눌러 뽑으세요'}
                  </span>
                </div>

                {/* Embossed Can Ribs (3D metallic lines) */}
                <div className="w-full space-y-2 opacity-50 pb-6">
                  <div className="w-full h-1 bg-slate-200" />
                  <div className="w-full h-1 bg-slate-950" />
                  <div className="w-full h-1 bg-slate-200" />
                </div>
              </div>
            </div>

            {/* GIANT CAN 2: 일의 자리 깡통 */}
            <div className="relative w-48 sm:w-64 md:w-80 h-72 sm:h-96 md:h-[420px] flex flex-col items-center justify-end">
              {/* Spoons protruding from the giant can rim */}
              <div className="absolute top-0 inset-x-0 h-44 sm:h-56 pointer-events-auto z-10">
                {ONES_SPOONS.map((spoon) => {
                  const isPicked = pickedOnesId === spoon.id;
                  const isLocked = isOnesRevealed || pickedOnesId !== null;

                  return (
                    <motion.div
                      key={spoon.id}
                      initial={false}
                      animate={
                        isPicked
                          ? { y: -260, scale: 1.3, opacity: [1, 1, 0] }
                          : isLocked
                          ? { opacity: 0.3 }
                          : { y: 0, opacity: 1 }
                      }
                      whileHover={
                        !isLocked
                          ? {
                              y: -24,
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
                      className="group flex flex-col items-center select-none"
                    >
                      {/* Spoon Oval Head / Handle */}
                      <div className="w-8 h-14 sm:w-11 sm:h-18 md:w-13 md:h-22 rounded-t-full rounded-b-2xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 border-2 border-slate-100 shadow-xl group-hover:shadow-amber-400/80 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                        <div className="absolute top-1 left-1.5 w-1.5 h-8 bg-white/80 rounded-full blur-[0.5px]" />
                        <span className="text-xs sm:text-sm font-black text-slate-700 font-mono">
                          {isPicked && isOnesRevealed ? onesDigit : '?'}
                        </span>
                      </div>
                      {/* Spoon Neck */}
                      <div className="w-3.5 h-20 sm:w-4 sm:h-28 md:w-5 md:h-36 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-inner" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Giant Tin Can Body (Bottom extends off-screen) */}
              <div className="relative z-20 w-full h-56 sm:h-76 md:h-92 rounded-t-3xl bg-gradient-to-r from-slate-700 via-slate-400 to-slate-800 border-t-4 border-x-4 border-slate-300 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-between p-4 overflow-hidden">
                {/* Can Top Opening Oval Rim */}
                <div className="w-full h-9 sm:h-12 rounded-[50%] bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-400 shadow-inner flex items-center justify-center shrink-0">
                  <div className="w-[88%] h-4 sm:h-6 rounded-[50%] bg-black/90 blur-[1px]" />
                </div>

                {/* Big Vintage Front Can Label */}
                <div className="my-auto px-4 py-2 sm:py-3 rounded-2xl bg-amber-600/90 text-white border-2 border-amber-300 shadow-xl text-center">
                  <span className="block text-[10px] sm:text-xs font-black tracking-widest uppercase text-amber-100">
                    ONES DIGIT CAN
                  </span>
                  <span className="text-sm sm:text-lg md:text-xl font-black font-mono">
                    깡통 2: 일의 자리
                  </span>
                  <span className="block text-[10px] text-amber-100/80 font-bold mt-0.5">
                    {isOnesRevealed ? '✅ 뽑기 완료' : '숟가락을 눌러 뽑으세요'}
                  </span>
                </div>

                {/* Embossed Can Ribs (3D metallic lines) */}
                <div className="w-full space-y-2 opacity-50 pb-6">
                  <div className="w-full h-1 bg-slate-200" />
                  <div className="w-full h-1 bg-slate-950" />
                  <div className="w-full h-1 bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
