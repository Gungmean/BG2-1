import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  Calendar,
  Plus,
  X,
  MessageSquare,
  Gift,
  Sparkles,
  BookOpenCheck
} from 'lucide-react';

const GAP = 2.5; // degrees gap between wedges

const WEDGES = [
  { id: 'sug',      label: '건의함',     Icon: MessageSquare, color: '#6366f1' },
  { id: 'luck',     label: '뽑기',       Icon: Gift,          color: '#f59e0b' },
  { id: 'examPlan', label: '평가계획서', Icon: BookOpenCheck, color: '#8b5cf6' },
];

const ANGLE = 180 / WEDGES.length; // 60 degrees each

function polar(r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: -r * Math.sin(rad) };
}

function wedgePath(i, rOuter, rInner) {
  const start = 180 - i * ANGLE;
  const end   = start - ANGLE;
  const s0 = polar(rOuter, start - GAP / 2);
  const e0 = polar(rOuter, end   + GAP / 2);
  const s1 = polar(rInner, start - GAP / 2);
  const e1 = polar(rInner, end   + GAP / 2);
  return [
    `M ${s1.x} ${s1.y}`,
    `L ${s0.x} ${s0.y}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${e0.x} ${e0.y}`,
    `L ${e1.x} ${e1.y}`,
    `A ${rInner} ${rInner} 0 0 0 ${s1.x} ${s1.y}`,
    'Z',
  ].join(' ');
}

function wedgeMid(i, rOuter, rInner) {
  const mid = 180 - i * ANGLE - ANGLE / 2;
  const r   = (rOuter + rInner) / 2;
  return polar(r, mid);
}

function getSizes() {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  return isDesktop
    ? { rOuter: 170, rInner: 52, iconSize: 22, fontSize: 12, fabSize: 64 }
    : { rOuter: 118, rInner: 38, iconSize: 16, fontSize: 9.5, fabSize: 52 };
}

export default function Navbar({
  activeTab,
  setActiveTab
}) {
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(null);
  const [sizes, setSizes]     = useState(getSizes);

  useEffect(() => {
    const onResize = () => setSizes(getSizes());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { rOuter, rInner, iconSize, fontSize, fabSize } = sizes;
  const W  = (rOuter + 16) * 2;
  const H  = rOuter + 16;
  const OX = W / 2;
  const OY = H;

  const actions = [
    () => { setOpen(false); setActiveTab('suggestion'); },
    () => { setOpen(false); setActiveTab('draw'); },
    () => { setOpen(false); setActiveTab('examPlan'); },
  ];

  return (
    <>
      {/* Dim Backdrop with Fade Motion */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] cursor-pointer"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Wedge Menu SVG Container */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        style={{ bottom: '3.25rem' }}
      >
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: 'visible', display: 'block', pointerEvents: open ? 'auto' : 'none' }}
        >
          <g transform={`translate(${OX},${OY})`}>
            {WEDGES.map((w, i) => {
              const mid   = wedgeMid(i, rOuter, rInner);
              const isHov = hovered === i;

              return (
                <motion.g
                  key={w.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    open
                      ? {
                          scale: isHov ? 1.05 : 1,
                          opacity: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 380,
                            damping: 24,
                            delay: i * 0.04
                          }
                        }
                      : {
                          scale: 0,
                          opacity: 0,
                          transition: { duration: 0.15, delay: (3 - i) * 0.02 }
                        }
                  }
                  whileTap={{ scale: 0.96 }}
                  style={{
                    transformOrigin: '0px 0px',
                    cursor: 'pointer',
                    pointerEvents: open ? 'auto' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    actions[i]();
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onTouchStart={() => setHovered(i)}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    actions[i]();
                    setHovered(null);
                  }}
                >
                  {/* Shadow layer */}
                  <path
                    d={wedgePath(i, rOuter, rInner)}
                    fill="transparent"
                    style={{
                      filter: isHov
                        ? `drop-shadow(0 8px 20px ${w.color}55)`
                        : 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))',
                      transition: 'filter 0.2s',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Main wedge */}
                  <path
                    d={wedgePath(i, rOuter, rInner)}
                    fill={isHov ? w.color : '#ffffff'}
                    stroke={isHov ? 'transparent' : `${w.color}66`}
                    strokeWidth="1.5"
                    style={{
                      transition: 'fill 0.18s ease, stroke 0.18s ease',
                      pointerEvents: 'auto'
                    }}
                  />

                  {/* Icon */}
                  <foreignObject
                    x={mid.x - iconSize / 2}
                    y={mid.y - iconSize - fontSize / 2 - 3}
                    width={iconSize}
                    height={iconSize}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <w.Icon
                      width={iconSize}
                      height={iconSize}
                      color={isHov ? '#ffffff' : w.color}
                      strokeWidth={2}
                      style={{ display: 'block', transition: 'color 0.18s' }}
                    />
                  </foreignObject>

                  {/* Label */}
                  <text
                    x={mid.x}
                    y={mid.y + fontSize / 2 + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontWeight="700"
                    fill={isHov ? '#ffffff' : '#64748b'}
                    style={{ pointerEvents: 'none', transition: 'fill 0.18s', userSelect: 'none' }}
                  >
                    {w.label}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Navbar bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] h-16 flex items-center">
        <div className="max-w-md w-full mx-auto flex items-center justify-around px-6 relative">

          {/* 게시판 */}
          <NavBtn
            active={activeTab === 'board'}
            icon={<LayoutGrid className="w-5 h-5" />}
            label="게시판"
            layoutId="navTabPill"
            onClick={() => { setOpen(false); setActiveTab('board'); }}
          />

          {/* CENTER FAB */}
          <div className="flex flex-col items-center -mt-5 z-[60]">
            <motion.button
              type="button"
              onClick={() => setOpen(o => !o)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.90 }}
              title="학급 메뉴"
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 transition-colors duration-300 text-white ${
                open
                  ? 'bg-slate-800 ring-slate-100 shadow-slate-300'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 ring-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-300/80'
              }`}
            >
              <motion.div
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </motion.div>
            </motion.button>
            <span className={`text-[10px] font-bold mt-0.5 transition-colors ${open ? 'text-slate-800' : 'text-slate-400'}`}>
              {open ? '닫기' : '더보기'}
            </span>
          </div>

          {/* 일정 */}
          <NavBtn
            active={activeTab === 'calendar'}
            icon={<Calendar className="w-5 h-5" />}
            label="일정"
            layoutId="navTabPill"
            onClick={() => { setOpen(false); setActiveTab('calendar'); }}
          />
        </div>
      </nav>
    </>
  );
}

function NavBtn({ active, icon, label, layoutId, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={`relative flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-colors ${
        active ? 'text-blue-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-semibold'
      }`}
    >
      <div className="relative p-1.5 rounded-xl">
        {active && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-0 bg-blue-50 rounded-xl"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <span className="relative z-10">{icon}</span>
      </div>
      <span className="text-[10px] relative z-10">{label}</span>
    </motion.button>
  );
}
