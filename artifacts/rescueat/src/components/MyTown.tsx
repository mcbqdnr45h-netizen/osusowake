import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getTownStage, TOWN_STAGES, MAX_STAGE } from '@/lib/town-stage';

interface MyTownProps {
  purchaseCount: number;
  fullPage?: boolean;
}

const LS_KEY = 'rescueat_mytownStage';

const TITLES: Record<number, string> = {
  0:  '見習い市民',
  1:  '新米市長',
  2:  '若葉の守り手',
  3:  '芽吹きの使者',
  4:  '緑の開拓者',
  5:  'おすそわけ隊長',
  6:  '森の守護者',
  7:  '収穫の達人',
  8:  '環境の英雄',
  9:  '伝説の守り手',
  10: 'フードロス・ヒーロー',
};

function getTitle(stage: number) {
  return TITLES[Math.min(stage, MAX_STAGE)] ?? TITLES[MAX_STAGE];
}

function fireConfetti() {
  const colors = ['#FF8C00', '#FFD700', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#fff'];
  const shared = { particleCount: 60, spread: 80, colors, startVelocity: 45, gravity: 0.9 };
  confetti({ ...shared, origin: { x: 0.25, y: 0.55 }, angle: 60 });
  confetti({ ...shared, origin: { x: 0.75, y: 0.55 }, angle: 120 });
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, colors, origin: { x: 0.5, y: 0.4 }, gravity: 0.7 });
  }, 250);
}

// ── Time of day hook ────────────────────────────────────────────────────────
function useTimeOfDay() {
  const getH = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const [h, setH] = useState(getH);
  useEffect(() => {
    const t = setInterval(() => setH(getH()), 60_000);
    return () => clearInterval(t);
  }, []);
  return h;
}

function lerpColor(a: string, b: string, t: number): string {
  const p = (c: string, s: number) => parseInt(c.slice(s, s + 2), 16);
  const r = (x: number) => Math.round(Math.max(0, Math.min(255, x)));
  return `rgb(${r(p(a,1)+(p(b,1)-p(a,1))*t)},${r(p(a,3)+(p(b,3)-p(a,3))*t)},${r(p(a,5)+(p(b,5)-p(a,5))*t)})`;
}

type SkyState = { top: string; bot: string; isNight: boolean; isSunrise: boolean; isSunset: boolean };

function getSky(timeH: number): SkyState {
  type S = { h: number; top: string; bot: string };
  const stops: S[] = [
    { h:  0, top: '#0a1628', bot: '#1a2848' },
    { h:  4, top: '#111a3a', bot: '#1e2e58' },
    { h:  5, top: '#3a1f5a', bot: '#6a3878' },
    { h:  6, top: '#d05c28', bot: '#f09050' },
    { h:  7, top: '#5890d0', bot: '#8cbce0' },
    { h: 10, top: '#3a7ccc', bot: '#74b0de' },
    { h: 13, top: '#2868c0', bot: '#60a4d8' },
    { h: 16, top: '#3876c8', bot: '#6eaee2' },
    { h: 17, top: '#d46018', bot: '#eeaa40' },
    { h: 18, top: '#c03c14', bot: '#de7050' },
    { h: 19, top: '#781838', bot: '#a85478' },
    { h: 20, top: '#1e1840', bot: '#30409e' },
    { h: 22, top: '#0a1628', bot: '#1a2848' },
    { h: 24, top: '#0a1628', bot: '#1a2848' },
  ];
  let a = stops[0], b = stops[1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (timeH >= stops[i].h && timeH < stops[i + 1].h) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const t = Math.min(1, Math.max(0, (timeH - a.h) / (b.h - a.h)));
  return {
    top:       lerpColor(a.top, b.top, t),
    bot:       lerpColor(a.bot, b.bot, t),
    isNight:   timeH < 6  || timeH >= 20,
    isSunrise: timeH >= 5 && timeH < 8,
    isSunset:  timeH >= 16.5 && timeH < 19.5,
  };
}

// ── Fixed star positions [x, y, r] ─────────────────────────────────────────
const STARS: [number, number, number][] = [
  [28,16,1.1],[58,7,0.8],[112,13,1.2],[148,5,0.7],[195,11,1.0],[238,4,1.3],
  [272,19,0.9],[308,9,1.1],[342,15,0.8],[18,32,0.7],[88,40,1.0],[172,36,0.9],
  [222,30,1.2],[258,44,0.8],[298,37,1.0],[338,27,0.9],[44,24,1.1],[72,48,0.7],
  [142,28,0.8],[326,43,1.0],[180,22,0.6],[52,10,0.9],[290,28,0.8],[134,44,0.7],
];

// ── Background town silhouettes ─────────────────────────────────────────────
function TownBuildings({ stage, color }: { stage: number; color: string }) {
  const ge = (n: number) => stage >= n;
  const house = (x: number, y: number, w: number, h: number, rH: number) =>
    `M${x},${y} L${x},${y-h} L${x+w/2},${y-h-rH} L${x+w},${y-h} L${x+w},${y} Z`;
  const bldg = (x: number, y: number, w: number, h: number) =>
    `M${x},${y} L${x},${y-h} L${x+w},${y-h} L${x+w},${y} Z`;
  return (
    <g fill={color}>
      {/* Stage 2+: far-side small village */}
      {ge(2) && <>
        <path d={house(6,  130, 30, 20, 11)} />
        <path d={house(40, 130, 24, 17,  9)} />
        <path d={house(302,130, 28, 18, 10)} />
        <path d={house(330,130, 24, 15,  8)} />
      </>}
      {/* Stage 4+: small neighbourhood */}
      {ge(4) && <>
        <path d={house(68, 130, 22, 14,  7)} />
        <path d={house(92, 130, 28, 16,  8)} />
        <path d={house(264,130, 24, 15,  7)} />
        <path d={house(290,130, 22, 13,  7)} />
      </>}
      {/* Stage 6+: 2-story buildings */}
      {ge(6) && <>
        <path d={bldg( 4, 130, 12, 38)} />
        <path d={bldg(18, 130, 20, 28)} />
        <path d={bldg(118,130, 18, 22)} />
        <path d={bldg(330,130, 14, 32)} />
        <path d={bldg(316,130, 18, 24)} />
        <path d={bldg(228,130, 16, 20)} />
      </>}
      {/* Stage 8+: city towers */}
      {ge(8) && <>
        <path d={bldg( 0, 130,  8, 58)} />
        <path d={bldg(10, 130, 16, 50)} />
        <path d={bldg(28, 130, 10, 64)} />
        <path d={bldg(116,130, 10, 42)} />
        <path d={bldg(128,130, 14, 36)} />
        <path d={bldg(218,130, 12, 38)} />
        <path d={bldg(234,130, 10, 44)} />
        <path d={bldg(340,130, 14, 52)} />
        <path d={bldg(326,130, 12, 46)} />
        <path d={bldg(352,130,  8, 60)} />
      </>}
      {/* Stage 10: eco city — extra rooftop gardens */}
      {ge(10) && <>
        <ellipse cx="22"  cy="80" rx="8"  ry="5"  fill="#2d8c10" opacity="0.85" />
        <ellipse cx="34"  cy="66" rx="10" ry="6"  fill="#2d8c10" opacity="0.85" />
        <ellipse cx="338" cy="78" rx="9"  ry="5"  fill="#2d8c10" opacity="0.85" />
        <ellipse cx="348" cy="70" rx="7"  ry="4"  fill="#3aac18" opacity="0.85" />
      </>}
    </g>
  );
}

// ── Level-up particle burst (pure CSS) ──────────────────────────────────────
function LevelUpParticles({ active }: { active: boolean }) {
  if (!active) return null;
  const PARTICLES = [
    { angle: 0,   color: '#FF8C00', delay: 0 },
    { angle: 22,  color: '#FFD700', delay: 0.05 },
    { angle: 45,  color: '#4CAF50', delay: 0.1 },
    { angle: 67,  color: '#FF8C00', delay: 0.05 },
    { angle: 90,  color: '#2196F3', delay: 0 },
    { angle: 112, color: '#FFD700', delay: 0.1 },
    { angle: 135, color: '#E91E63', delay: 0.05 },
    { angle: 157, color: '#FF8C00', delay: 0 },
    { angle: 180, color: '#4CAF50', delay: 0.08 },
    { angle: 202, color: '#FFD700', delay: 0.02 },
    { angle: 225, color: '#FF8C00', delay: 0.12 },
    { angle: 247, color: '#2196F3', delay: 0.04 },
    { angle: 270, color: '#E91E63', delay: 0 },
    { angle: 292, color: '#FFD700', delay: 0.07 },
    { angle: 315, color: '#4CAF50', delay: 0.03 },
    { angle: 337, color: '#FF8C00', delay: 0.09 },
  ];
  return (
    <div
      className="absolute pointer-events-none"
      style={{ inset: 0, overflow: 'hidden' }}
    >
      <style>{`
        @keyframes lvup-particle {
          0%   { transform: translate(-50%,-50%) rotate(var(--a)) translateY(0px) scale(1); opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: translate(-50%,-50%) rotate(var(--a)) translateY(-80px) scale(0.2); opacity: 0; }
        }
        @keyframes lvup-glow {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          30%      { opacity: 0.7; transform: scale(1.2); }
          70%      { opacity: 0.3; transform: scale(1.0); }
        }
      `}</style>
      {/* Glow pulse */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 120, height: 120,
        background: 'radial-gradient(circle, rgba(255,200,0,0.55) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        animation: 'lvup-glow 1.8s ease-out forwards',
        borderRadius: '50%',
      }} />
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '42%',
          width: 8, height: 8,
          borderRadius: '50%',
          background: p.color,
          ['--a' as string]: `${p.angle}deg`,
          animation: `lvup-particle 1.4s ease-out ${p.delay}s forwards`,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}
    </div>
  );
}

// ── Evolution Popup ─────────────────────────────────────────────────────────
function EvolutionPopup({ stage, onClose }: { stage: number; onClose: () => void }) {
  const info  = TOWN_STAGES[stage];
  const title = getTitle(stage);

  useEffect(() => {
    fireConfetti();
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.05 }}
        className="bg-card rounded-3xl shadow-2xl mx-6 overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-5 text-center"
          style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #e55b00 100%)' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ delay: 0.2, duration: 0.6, times: [0, 0.7, 1] }}
            className="text-7xl mb-2 filter drop-shadow-lg"
          >
            {info.icon}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-white/80 text-sm font-bold tracking-widest uppercase mb-1">STAGE {stage} 達成！</p>
            <h2 className="text-white text-2xl font-black">{info.name}</h2>
          </motion.div>
          {/* Sparkle dots */}
          {[[-24,-16],[24,-16],[0,4],[-32,4],[32,4]].map(([x,y],i) => (
            <motion.div key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0,1.4,0.9,1], opacity: [0,1,1,0.8] }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
              className="absolute w-3 h-3 bg-white rounded-full opacity-80"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(30% + ${y}px)` }}
            />
          ))}
        </div>
        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Lv.{stage}
            </span>
            <span className="text-foreground font-bold text-sm">{title}</span>
          </div>
          <p className="text-muted-foreground text-sm text-center leading-relaxed mb-4">
            {info.description}
          </p>
          {info.benefit && (
            <div className="bg-primary/8 rounded-2xl px-4 py-3 text-center">
              <p className="text-primary font-bold text-sm">✨ {info.benefit}</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full mt-4 bg-primary text-primary-foreground font-black py-3 rounded-2xl
              active:scale-97 transition-transform text-sm"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            すごい！ありがとう 🎉
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOWN SCENE  — animated SVG
// ══════════════════════════════════════════════════════════════════════════════
function TownScene({
  stage,
  purchaseCount,
  tall = false,
  fillHeight = false,
  showLevelUp = false,
}: {
  stage: number;
  purchaseCount: number;
  tall?: boolean;
  fillHeight?: boolean;
  showLevelUp?: boolean;
}) {
  const timeH = useTimeOfDay();
  const sky   = getSky(timeH);
  const ge    = (n: number) => stage >= n;

  const shift = tall ? 60 : 0;
  const viewH = tall ? 240 : 180;
  const svgH  = fillHeight ? '100%' : undefined;

  // Sky desaturation for low stages (world not yet blooming)
  const desat = stage === 0 ? 0.7 : stage === 1 ? 0.4 : 0;

  // Silhouette color based on time of day
  const silColor = sky.isNight
    ? 'rgba(6,14,32,0.88)'
    : sky.isSunset
    ? 'rgba(35,16,8,0.55)'
    : 'rgba(18,36,64,0.48)';

  // Sun position — moves across sky based on time (rises east=right, sets west=left)
  const sunVisible = !sky.isNight;
  const sunFrac    = Math.min(1, Math.max(0, (timeH - 6) / 12)); // 0 at 6am, 1 at 6pm
  const sunX       = 20 + sunFrac * 320;
  const sunY       = 65 - Math.sin(sunFrac * Math.PI) * 52; // arc across sky
  const sunColor   = sky.isSunset || sky.isSunrise ? '#ffb830' : '#ffe060';
  const sunGlow    = sky.isSunset || sky.isSunrise ? 'rgba(255,140,30,0.22)' : 'rgba(255,230,60,0.18)';

  // Ground color deepens with stage
  const groundTops = ['#786010','#8a7022','#6aaa28','#52a020','#3a9818','#289010','#1a8008','#127000','#0e6000','#0a5200','#064000'];
  const groundMids = ['#5a3c10','#6a4818','#4a7618','#3a6e14','#2c6610','#1e5e0c','#165408','#104a06','#0c4004','#083600','#062c00'];
  const groundTop  = groundTops[Math.min(stage, 10)];
  const groundMid  = groundMids[Math.min(stage, 10)];

  // ── Fruit helper ──────────────────────────────────────────────────────────
  const Fruit = ({ x, y, r, g }: { x: number; y: number; r: number; g: string }) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.22} ry={r * 0.18}
        fill="rgba(255,255,255,0.32)" />
      <path d={`M${x} ${y - r} C${x - 1.5} ${y - r - 3} ${x + 2} ${y - r - 5} ${x + 1} ${y - r - 7}`}
        stroke="#2a6010" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  );

  // ── Flower helper ─────────────────────────────────────────────────────────
  const Flower = ({ x, y, c, r }: { x: number; y: number; c: string; r: number }) => (
    <g>
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <ellipse key={i}
            cx={x + Math.cos(rad) * r * 0.85} cy={y + Math.sin(rad) * r * 0.85}
            rx={r * 0.6} ry={r * 0.4}
            transform={`rotate(${deg + 90},${x + Math.cos(rad) * r * 0.85},${y + Math.sin(rad) * r * 0.85})`}
            fill={c} />
        );
      })}
      <circle cx={x} cy={y} r={r * 0.38} fill="#FFE060" />
    </g>
  );

  // Sway duration by stage (small plants sway faster, big trees slower)
  const swayDur = stage <= 2 ? '3.5s' : stage <= 5 ? '5s' : '7.5s';
  // Sway amplitude by stage (small: ±2.5°, medium: ±1.5°, large: ±0.7°)
  const swayAng = stage <= 2 ? 2.5 : stage <= 5 ? 1.5 : 0.7;
  const swayVals = `-${swayAng} 180 130;${swayAng} 180 130;-${swayAng * 0.7} 180 130;${swayAng * 1.1} 180 130;-${swayAng} 180 130`;

  // CSS animation keyframes (inside SVG <style>)
  const SVG_CSS = `
    @keyframes mt-leaf-shimmer {
      0%,100% { opacity:1; }
      50%     { opacity:0.82; }
    }
    @keyframes mt-glow-pulse {
      0%,100% { opacity:0.55; r:90px; }
      50%     { opacity:0.75; r:105px; }
    }
    @keyframes mt-sparkle {
      0%,100% { opacity:0.3; transform:scale(0.7)rotate(0deg); }
      50%     { opacity:1.0; transform:scale(1.3)rotate(180deg); }
    }
    .mt-shimmer  { animation:mt-leaf-shimmer 4s ease-in-out infinite; }
    .mt-shimmer2 { animation:mt-leaf-shimmer 4s ease-in-out 1.4s infinite; }
    .mt-shimmer3 { animation:mt-leaf-shimmer 4s ease-in-out 2.8s infinite; }
    .mt-sparkle  { animation:mt-sparkle 2s ease-in-out infinite; }
    .mt-sparkle2 { animation:mt-sparkle 2.4s ease-in-out 0.4s infinite; }
    .mt-sparkle3 { animation:mt-sparkle 2s ease-in-out 0.8s infinite; }
  `;

  return (
    <svg
      viewBox={`0 0 360 ${viewH}`}
      width="100%"
      height={svgH}
      style={fillHeight ? { display: 'block', height: '100%' } : { display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>{SVG_CSS}</style>

        {/* ── Sky ── */}
        <linearGradient id="mtSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={sky.top} />
          <stop offset="100%" stopColor={sky.bot} />
        </linearGradient>

        {/* ── Desaturation overlay for low stages ── */}
        <linearGradient id="mtDesat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={`rgba(140,130,120,${desat})`} />
          <stop offset="100%" stopColor={`rgba(120,110,100,${desat * 0.6})`} />
        </linearGradient>

        {/* ── Ground ── */}
        <linearGradient id="mtGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={groundTop} />
          <stop offset="100%" stopColor={groundMid} />
        </linearGradient>

        {/* ── Leaves ── */}
        <linearGradient id="mtLeaf1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#90d838" />
          <stop offset="100%" stopColor="#3a9010" />
        </linearGradient>
        <linearGradient id="mtLeaf2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#6ec820" />
          <stop offset="100%" stopColor="#287c08" />
        </linearGradient>
        <linearGradient id="mtLeaf3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#4eb010" />
          <stop offset="100%" stopColor="#1a6000" />
        </linearGradient>

        {/* ── Crown ── */}
        <radialGradient id="mtCrown1" cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#5ac830" />
          <stop offset="100%" stopColor="#1e7808" />
        </radialGradient>
        <radialGradient id="mtCrown2" cx="40%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#48b028" />
          <stop offset="100%" stopColor="#156206" />
        </radialGradient>
        <radialGradient id="mtCrown3" cx="42%" cy="35%" r="68%">
          <stop offset="0%"   stopColor="#329018" />
          <stop offset="100%" stopColor="#0e5204" />
        </radialGradient>

        {/* ── Trunk ── */}
        <linearGradient id="mtTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6a3810" />
          <stop offset="40%"  stopColor="#9c5a20" />
          <stop offset="100%" stopColor="#5a2e08" />
        </linearGradient>

        {/* ── Fruits ── */}
        <radialGradient id="mtFruitO" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#ffb030" />
          <stop offset="100%" stopColor="#e06000" />
        </radialGradient>
        <radialGradient id="mtFruitR" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#ff7060" />
          <stop offset="100%" stopColor="#cc2020" />
        </radialGradient>
        <radialGradient id="mtFruitG" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#90d840" />
          <stop offset="100%" stopColor="#348010" />
        </radialGradient>
        <radialGradient id="mtFruitAu" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#ffe060" />
          <stop offset="100%" stopColor="#c88010" />
        </radialGradient>

        {/* ── Golden glow (stage 10) ── */}
        <radialGradient id="mtGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE060" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#FF9000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FF9000" stopOpacity="0" />
        </radialGradient>

        {/* ── Shadows ── */}
        <filter id="mtShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
        </filter>
        <filter id="mtShadowSm" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(0,0,0,0.22)" />
        </filter>
        <filter id="mtGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* ── Sun glow ── */}
        <radialGradient id="mtSunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={sunGlow} stopOpacity="1" />
          <stop offset="100%" stopColor={sunGlow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ══ SKY BACKGROUND ══════════════════════════════════════════════════ */}
      <rect x="0" y="0" width="360" height={viewH} fill={`url(#mtSky)`} />
      {desat > 0 && <rect x="0" y="0" width="360" height={viewH} fill="url(#mtDesat)" />}

      {/* Stage shift wrapper */}
      <g transform={shift ? `translate(0,${shift})` : undefined}>

        {/* ══ NIGHT: Stars ══════════════════════════════════════════════════ */}
        {sky.isNight && (
          <g fill="white">
            {STARS.map(([sx, sy, sr], i) => (
              <circle key={i} cx={sx} cy={sy} r={sr} opacity={0.55 + (i % 4) * 0.1}>
                {/* Twinkle */}
                <animate attributeName="opacity"
                  values={`${0.55 + (i % 4) * 0.1};1;${0.55 + (i % 4) * 0.1}`}
                  dur={`${2.5 + (i % 6) * 0.7}s`}
                  begin={`-${(i % 5) * 0.6}s`}
                  repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        )}

        {/* ══ NIGHT: Moon ═══════════════════════════════════════════════════ */}
        {sky.isNight && (
          <g>
            <circle cx="294" cy="30" r="16" fill="#f8f2d8" opacity="0.95" />
            <circle cx="300" cy="26" r="13" fill={sky.top} opacity="0.9" />
            {/* Subtle craters */}
            <circle cx="282" cy="34" r="2"   fill="rgba(200,190,160,0.5)" />
            <circle cx="288" cy="26" r="1.2" fill="rgba(200,190,160,0.4)" />
          </g>
        )}

        {/* ══ SUNRISE / SUNSET: warm glow horizon ══════════════════════════ */}
        {(sky.isSunrise || sky.isSunset) && (
          <>
            <ellipse cx="180" cy="130" rx="220" ry="72"
              fill={sky.isSunrise ? 'rgba(255,140,50,0.14)' : 'rgba(200,70,20,0.16)'} />
            <ellipse cx={sunX} cy="130" rx="160" ry="50"
              fill={sky.isSunset ? 'rgba(180,50,0,0.12)' : 'rgba(255,160,50,0.1)'} />
          </>
        )}

        {/* ══ SUN ═══════════════════════════════════════════════════════════ */}
        {sunVisible && (
          <g transform={`translate(${sunX},${sunY})`}>
            {/* Glow halo */}
            <circle cx="0" cy="0" r="26" fill={sunGlow} opacity="1" />
            {/* Sun disc */}
            <circle cx="0" cy="0" r="12" fill={sunColor} opacity="0.92" />
            {/* Rays (hidden at sunrise/sunset as disc is near horizon) */}
            {!sky.isSunrise && !sky.isSunset && (
              <>
                {[0,45,90,135].map(deg => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line key={deg}
                      x1={Math.cos(rad) * 16} y1={Math.sin(rad) * 16}
                      x2={Math.cos(rad) * 22} y2={Math.sin(rad) * 22}
                      stroke={sunColor} strokeWidth="2" strokeLinecap="round" opacity="0.65">
                      <animate attributeName="opacity" values="0.65;0.35;0.65" dur="3s" repeatCount="indefinite" />
                    </line>
                  );
                })}
              </>
            )}
          </g>
        )}

        {/* ══ ANIMATED CLOUDS ═══════════════════════════════════════════════ */}
        {/* Cloud 1 — large, mid-height */}
        <g opacity={sky.isNight ? 0.14 : 0.88}>
          <animateTransform attributeName="transform" type="translate"
            from="-130 0" to="490 0" dur="40s" begin="-14s" repeatCount="indefinite" />
          <ellipse cx="48"  cy="32" rx="26" ry="13" fill="white" />
          <ellipse cx="30"  cy="37" rx="20" ry="12" fill="white" />
          <ellipse cx="68"  cy="36" rx="22" ry="11" fill="white" />
          <ellipse cx="52"  cy="42" rx="30" ry="8"  fill="white" />
        </g>

        {/* Cloud 2 — medium, higher */}
        <g opacity={sky.isNight ? 0.10 : 0.72}>
          <animateTransform attributeName="transform" type="translate"
            from="-90 0" to="450 0" dur="62s" begin="-31s" repeatCount="indefinite" />
          <ellipse cx="220" cy="18" rx="20" ry="9"  fill="white" />
          <ellipse cx="206" cy="22" rx="15" ry="8"  fill="white" />
          <ellipse cx="234" cy="21" rx="17" ry="7"  fill="white" />
          <ellipse cx="220" cy="26" rx="22" ry="6"  fill="white" />
        </g>

        {/* Cloud 3 — small, drifting slow */}
        <g opacity={sky.isNight ? 0.08 : 0.58}>
          <animateTransform attributeName="transform" type="translate"
            from="-70 0" to="430 0" dur="85s" begin="-52s" repeatCount="indefinite" />
          <ellipse cx="300" cy="44" rx="16" ry="7"  fill="white" />
          <ellipse cx="289" cy="47" rx="12" ry="6"  fill="white" />
          <ellipse cx="313" cy="46" rx="13" ry="6"  fill="white" />
          <ellipse cx="300" cy="51" rx="18" ry="5"  fill="white" />
        </g>

        {/* ══ BACKGROUND TOWN SILHOUETTES ════════════════════════════════════ */}
        <TownBuildings stage={stage} color={silColor} />

        {/* ══ GROUND ════════════════════════════════════════════════════════ */}
        <rect x="0" y="130" width="360" height={viewH - 130} fill="url(#mtGround)" />

        {/* Ground texture/details */}
        {stage === 0 && (
          /* Cracked dry earth */
          <g stroke="#6a4a18" strokeWidth="1" fill="none" opacity="0.4">
            <path d="M30 135 L45 140 L55 136 L65 142" /><path d="M80 133 L90 138" />
            <path d="M200 136 L215 141 L225 137" /><path d="M280 134 L295 139 L310 135" />
            <path d="M340 137 L352 142" />
          </g>
        )}
        {stage === 1 && (
          /* Slightly better soil — sparse grass blades */
          <g fill="#7a9428" opacity="0.7">
            {[20,50,80,290,320,345].map(x => (
              <path key={x} d={`M${x} 130 C${x-2} 124 ${x-4} 122 ${x-3} 119 M${x} 130 C${x+2} 124 ${x+4} 122 ${x+3} 119`}
                stroke="#7a9428" strokeWidth="1" fill="none" />
            ))}
          </g>
        )}
        {ge(2) && (
          /* Lush grass edge */
          <g>
            {[10,25,40,55,70,85,100,275,290,305,320,335,350].map((x, i) => {
              const h = 6 + (i % 3) * 2;
              return (
                <path key={x} d={`M${x} 130 C${x-2} ${130-h} ${x+3} ${130-h-3} ${x+1} ${130-h-6}`}
                  stroke="#6aaa28" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
              );
            })}
            {/* Small wildflowers (stage 4+) */}
            {ge(4) && (
              <>
                {[[22,127,'#ff8ca8'],[65,126,'#ffdc60'],[290,126,'#ff8ca8'],[330,127,'#a0d860']].map(([fx,fy,fc],i) => (
                  <g key={i}>
                    <circle cx={fx as number} cy={(fy as number)-3} r="3" fill={fc as string} opacity="0.9" />
                    <line x1={fx as number} y1={fy as number} x2={fx as number} y2={(fy as number)-3}
                      stroke="#4a8820" strokeWidth="1.2" />
                  </g>
                ))}
              </>
            )}
          </g>
        )}

        {/* ══ SIDE TREES ═══════════════════════════════════════════════════ */}
        {/* Left side tree (stage 5+) */}
        {ge(5) && (
          <g opacity="0.8">
            <path d="M38 130 C37 120 37 110 38 100 L46 100 C47 110 47 120 46 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="42" cy="93"  rx="18" ry="18" fill="url(#mtCrown2)" className="mt-shimmer2" />
            <ellipse cx="42" cy="79"  rx="13" ry="14" fill="url(#mtCrown1)" className="mt-shimmer2" />
            <ellipse cx="42" cy="68"  rx="9"  ry="10" fill="#4ec830"        className="mt-shimmer2" />
            {ge(7) && <><Fruit x={34} y={82} r={5} g="mtFruitO" /><Fruit x={50} y={80} r={5} g="mtFruitR" /></>}
          </g>
        )}

        {/* Right side tree (stage 5+) */}
        {ge(5) && (
          <g opacity="0.8">
            <path d="M316 130 C315 118 315 106 316 94 L325 94 C326 106 326 118 325 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="320" cy="87"  rx="19" ry="18" fill="url(#mtCrown2)" className="mt-shimmer3" />
            <ellipse cx="320" cy="73"  rx="14" ry="14" fill="url(#mtCrown1)" className="mt-shimmer3" />
            <ellipse cx="320" cy="62"  rx="10" ry="11" fill="#4ec830"        className="mt-shimmer3" />
            {ge(7) && <><Fruit x={312} y={76} r={5} g="mtFruitR" /><Fruit x={328} y={74} r={5} g="mtFruitAu" /></>}
          </g>
        )}

        {/* Extra deep-forest side trees (stage 8+) */}
        {ge(8) && (
          <g opacity="0.7">
            <path d="M14 130 C13 116 13 100 14 86 L22 86 C23 100 23 116 22 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="18" cy="79"  rx="18" ry="20" fill="#166000" />
            <ellipse cx="18" cy="63"  rx="13" ry="15" fill="#1a7008" />
            <path d="M336 130 C335 114 335 98 336 82 L345 82 C346 98 346 114 345 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="340" cy="75" rx="19" ry="22" fill="#166000" />
            <ellipse cx="340" cy="58" rx="14" ry="16" fill="#1a7008" />
          </g>
        )}

        {/* ══ CENTER PLANT — wind-sway wrapper ══════════════════════════════ */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={swayVals}
            keyTimes="0;0.28;0.52;0.76;1"
            dur={swayDur}
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
          />

          {/* ── STAGE 0: empty lot ── */}
          {stage === 0 && (
            <g opacity="0.5">
              <path d="M165 130 L175 130" stroke="#6a4820" strokeWidth="2" />
              <path d="M185 130 L195 130" stroke="#6a4820" strokeWidth="2" />
              <circle cx="180" cy="128" r="3" fill="#9a7040" opacity="0.4" />
            </g>
          )}

          {/* ── STAGE 1: cute seedling ── */}
          {stage === 1 && (
            <g filter="url(#mtShadowSm)">
              <path d="M180 130 C179 122 181 116 180 108" stroke="#4a9020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M180 112 C171 109 164 102 168 95 C172 89 179 95 180 105" fill="url(#mtLeaf1)" className="mt-shimmer" />
              <path d="M180 112 C189 109 196 102 192 95 C188 89 181 95 180 105" fill="url(#mtLeaf1)" className="mt-shimmer2" />
              <path d="M180 112 L170 97" stroke="#388018" strokeWidth="0.9" fill="none" opacity="0.55" />
              <path d="M180 112 L190 97" stroke="#388018" strokeWidth="0.9" fill="none" opacity="0.55" />
              <ellipse cx="168" cy="94" rx="2.2" ry="2.8" fill="#88eeff" opacity="0.75" />
              <path d="M173 130 Q180 126 187 130" fill="#5a3c10" opacity="0.35" />
            </g>
          )}

          {/* ── STAGE 2: 4-leaf seedling ── */}
          {stage === 2 && (
            <g filter="url(#mtShadowSm)">
              <path d="M180 130 C178 119 182 108 180 98" stroke="#489820" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M180 120 C170 117 162 108 167 100 C172 93 179 100 180 112" fill="url(#mtLeaf1)" className="mt-shimmer" />
              <path d="M180 120 C190 117 198 108 193 100 C188 93 181 100 180 112" fill="url(#mtLeaf1)" className="mt-shimmer3" />
              <path d="M180 104 C170 100 162 92 167 85 C172 78 180 86 180 97"  fill="url(#mtLeaf2)" className="mt-shimmer2" />
              <path d="M180 104 C190 100 198 92 193 85 C188 78 180 86 180 97"  fill="url(#mtLeaf2)" className="mt-shimmer" />
              <ellipse cx="180" cy="96" rx="5" ry="6" fill="#8ee040" />
              <ellipse cx="180" cy="93" rx="3.5" ry="3.5" fill="#b0f060" />
              <path d="M180 120 L169 103" stroke="#388018" strokeWidth="0.8" fill="none" opacity="0.45" />
              <path d="M180 120 L191 103" stroke="#388018" strokeWidth="0.8" fill="none" opacity="0.45" />
            </g>
          )}

          {/* ── STAGE 3: branching plant ── */}
          {stage === 3 && (
            <g filter="url(#mtShadowSm)">
              <path d="M180 130 C178 115 182 100 180 88" stroke="#3a9018" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M180 116 C172 110 162 107 154 102" stroke="#4aa020" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M180 108 C188 102 198 99 206 94"  stroke="#4aa020" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M154 102 C145 96 141 87 148 81 C155 75 161 84 157 94"   fill="url(#mtLeaf1)" className="mt-shimmer" />
              <path d="M154 102 C147 108 143 118 150 122 C157 125 161 115 157 104" fill="url(#mtLeaf2)" className="mt-shimmer2" />
              <path d="M206 94 C215 88 219 79 212 73 C205 67 199 76 203 87"    fill="url(#mtLeaf1)" className="mt-shimmer3" />
              <path d="M206 94 C215 100 218 111 211 114 C204 117 200 108 204 97" fill="url(#mtLeaf2)" className="mt-shimmer" />
              <path d="M180 88 C171 84 164 75 170 68 C176 62 182 70 181 81"    fill="url(#mtLeaf2)" className="mt-shimmer2" />
              <path d="M180 88 C189 84 196 75 190 68 C184 62 178 70 179 81"    fill="url(#mtLeaf2)" className="mt-shimmer3" />
              <ellipse cx="180" cy="86" rx="7" ry="8" fill="url(#mtLeaf1)" />
              <ellipse cx="180" cy="82" rx="4.5" ry="4.5" fill="#b0f050" />
            </g>
          )}

          {/* ── STAGE 4: young sapling ── */}
          {stage === 4 && (
            <g filter="url(#mtShadow)">
              <path d="M175 130 C173 117 173 104 174 94 L186 94 C187 104 187 117 185 130 Z" fill="url(#mtTrunk)" />
              <path d="M176 110 C165 103 152 99 142 93" stroke="#8B4C22" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M184 104 C195 97 208 93 218 87" stroke="#8B4C22" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <ellipse cx="136" cy="87" rx="22" ry="18" fill="url(#mtCrown1)" className="mt-shimmer2" />
              <ellipse cx="128" cy="80" rx="15" ry="12" fill="url(#mtLeaf2)"  className="mt-shimmer2" />
              <ellipse cx="146" cy="79" rx="13" ry="11" fill="url(#mtLeaf2)"  className="mt-shimmer2" />
              <ellipse cx="224" cy="81" rx="22" ry="18" fill="url(#mtCrown1)" className="mt-shimmer3" />
              <ellipse cx="216" cy="74" rx="14" ry="12" fill="url(#mtLeaf2)"  className="mt-shimmer3" />
              <ellipse cx="234" cy="76" rx="13" ry="11" fill="url(#mtLeaf2)"  className="mt-shimmer3" />
              <ellipse cx="180" cy="78" rx="30" ry="24" fill="url(#mtCrown1)" className="mt-shimmer" />
              <ellipse cx="168" cy="68" rx="19" ry="16" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="192" cy="66" rx="18" ry="15" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="180" cy="58" rx="18" ry="15" fill="url(#mtLeaf1)"  className="mt-shimmer2" />
            </g>
          )}

          {/* ── STAGE 5: flowering spring tree ── */}
          {stage === 5 && (
            <g filter="url(#mtShadow)">
              <path d="M173 130 C171 114 171 98 172 84 L188 84 C189 98 189 114 187 130 Z" fill="url(#mtTrunk)" />
              <path d="M174 106 C161 98 148 94 136 87" stroke="#8B4C22" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M186 98 C199 90 212 85 224 78" stroke="#8B4C22" strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse cx="128" cy="81" rx="26" ry="21" fill="url(#mtCrown1)" className="mt-shimmer2" />
              <ellipse cx="118" cy="73" rx="17" ry="14" fill="url(#mtCrown2)" className="mt-shimmer2" />
              <ellipse cx="140" cy="72" rx="16" ry="13" fill="url(#mtCrown2)" className="mt-shimmer2" />
              <ellipse cx="232" cy="72" rx="26" ry="21" fill="url(#mtCrown1)" className="mt-shimmer3" />
              <ellipse cx="222" cy="64" rx="16" ry="13" fill="url(#mtCrown2)" className="mt-shimmer3" />
              <ellipse cx="244" cy="66" rx="15" ry="13" fill="url(#mtCrown2)" className="mt-shimmer3" />
              <ellipse cx="180" cy="66" rx="38" ry="32" fill="url(#mtCrown1)" className="mt-shimmer" />
              <ellipse cx="163" cy="54" rx="24" ry="20" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="197" cy="52" rx="22" ry="19" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="180" cy="44" rx="22" ry="18" fill="url(#mtLeaf1)"  className="mt-shimmer2" />
              {[{x:120,y:76,c:'#ffb8d8'},{x:134,y:84,c:'#ffd8e8'},{x:148,y:72,c:'#ffb8d8'},
                {x:162,y:60,c:'#ffd8f0'},{x:174,y:50,c:'#ffb8d8'},{x:192,y:48,c:'#ffd8e8'},
                {x:206,y:58,c:'#ffb8d8'},{x:222,y:68,c:'#ffd8f0'},{x:236,y:76,c:'#ffb8d8'}].map(({x,y,c},i) => (
                <Flower key={i} x={x} y={y} c={c} r={5.5} />
              ))}
            </g>
          )}

          {/* ── STAGE 6: lush dense green tree ── */}
          {stage === 6 && (
            <g filter="url(#mtShadow)">
              <path d="M171 130 C168 112 168 94 170 76 L190 76 C192 94 192 112 189 130 Z" fill="url(#mtTrunk)" />
              {[88,101,114,125].map(y=>(
                <path key={y} d={`M173 ${y} Q180 ${y-4} 187 ${y}`} stroke="#6a3210" strokeWidth="1.2" fill="none" opacity="0.3" />
              ))}
              <path d="M173 108 C157 100 141 96 126 88" stroke="#7a3c12" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M187 100 C203 92 219 87 236 80" stroke="#7a3c12" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <ellipse cx="116" cy="82" rx="28" ry="24" fill="url(#mtCrown2)" className="mt-shimmer2" />
              <ellipse cx="106" cy="72" rx="18" ry="16" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="246" cy="74" rx="28" ry="24" fill="url(#mtCrown2)" className="mt-shimmer3" />
              <ellipse cx="256" cy="64" rx="18" ry="15" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="180" cy="58" rx="48" ry="40" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="160" cy="46" rx="30" ry="26" fill="url(#mtCrown3)" className="mt-shimmer" />
              <ellipse cx="200" cy="44" rx="28" ry="24" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="180" cy="36" rx="26" ry="22" fill="#339010"        className="mt-shimmer" />
              <ellipse cx="180" cy="24" rx="18" ry="16" fill="#3aa818"        className="mt-shimmer3" />
            </g>
          )}

          {/* ── STAGE 7: fruiting tree 🍊🍎 ── */}
          {stage === 7 && (
            <g filter="url(#mtShadow)">
              <path d="M169 130 C165 109 165 88 167 68 L193 68 C195 88 195 109 191 130 Z" fill="url(#mtTrunk)" />
              {[82,96,110,122].map(y=>(
                <path key={y} d={`M171 ${y} Q180 ${y-5} 189 ${y}`} stroke="#6a3210" strokeWidth="1.3" fill="none" opacity="0.3" />
              ))}
              <path d="M170 127 C158 129 146 126 138 123" stroke="#8B4c20" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M190 127 C202 129 214 126 222 123" stroke="#8B4c20" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M171 104 C152 93 132 88 112 80" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M189 96 C208 85 228 79 250 72" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
              <ellipse cx="102" cy="74" rx="30" ry="26" fill="url(#mtCrown2)" className="mt-shimmer2" />
              <ellipse cx="92"  cy="64" rx="20" ry="18" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="262" cy="66" rx="30" ry="26" fill="url(#mtCrown2)" className="mt-shimmer3" />
              <ellipse cx="272" cy="56" rx="20" ry="17" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="180" cy="50" rx="54" ry="46" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="156" cy="38" rx="34" ry="30" fill="url(#mtCrown3)" className="mt-shimmer" />
              <ellipse cx="204" cy="36" rx="32" ry="28" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="180" cy="28" rx="28" ry="24" fill="#289808"        className="mt-shimmer" />
              <ellipse cx="180" cy="16" rx="20" ry="16" fill="#2eae10"        className="mt-shimmer3" />
              {[{x:116,y:72,g:'mtFruitO'},{x:100,y:78,g:'mtFruitR'},{x:136,y:48,g:'mtFruitO'},
                {x:150,y:34,g:'mtFruitR'},{x:166,y:22,g:'mtFruitO'},{x:180,y:14,g:'mtFruitR'},
                {x:194,y:20,g:'mtFruitO'},{x:210,y:32,g:'mtFruitR'},{x:226,y:46,g:'mtFruitO'},
                {x:244,y:60,g:'mtFruitR'},{x:260,y:70,g:'mtFruitO'},{x:170,y:38,g:'mtFruitR'},
                {x:190,y:36,g:'mtFruitO'}].map(({x,y,g},i) => (
                <Fruit key={i} x={x} y={y} r={6.5} g={g} />
              ))}
              <rect x="136" y="127" width="88" height="8" fill="#c8a860" rx="2" opacity="0.9" />
              {[136,156,176,196].map(x=>(
                <rect key={x} x={x} y="127" width="18" height="8" fill="none" stroke="#b49038" strokeWidth="0.5" rx="1" opacity="0.6" />
              ))}
              <g fill="#7B4E28">
                <rect x="156" y="118" width="48" height="5" rx="2" /><rect x="156" y="109" width="48" height="4" rx="2" />
                <rect x="166" y="109" width="4"  height="14" rx="1" /><rect x="192" y="109" width="4" height="14" rx="1" />
                <rect x="160" y="123" width="4"  height="9"  rx="1" /><rect x="196" y="123" width="4" height="9"  rx="1" />
              </g>
            </g>
          )}

          {/* ── STAGE 8: large majestic tree ── */}
          {stage === 8 && (
            <g filter="url(#mtShadow)">
              <path d="M166 130 C161 107 161 84 163 60 L197 60 C199 84 199 107 194 130 Z" fill="url(#mtTrunk)" />
              {[76,90,104,118].map(y=>(
                <path key={y} d={`M169 ${y} Q180 ${y-5} 191 ${y}`} stroke="#6a3210" strokeWidth="1.4" fill="none" opacity="0.3" />
              ))}
              <path d="M167 125 C152 128 138 124 126 120" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M193 125 C208 128 222 124 234 120" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M168 104 C147 91 126 85 104 76"   stroke="#7a3c12" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              <path d="M192 92 C213 79 234 72 258 63"    stroke="#7a3c12" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              <ellipse cx="90"  cy="70" rx="34" ry="30" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="78"  cy="60" rx="22" ry="20" fill="#166000"        className="mt-shimmer2" />
              <ellipse cx="272" cy="57" rx="34" ry="30" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="284" cy="47" rx="22" ry="19" fill="#166000"        className="mt-shimmer3" />
              <ellipse cx="180" cy="42" rx="62" ry="54" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="154" cy="28" rx="40" ry="34" fill="url(#mtCrown3)" className="mt-shimmer" />
              <ellipse cx="206" cy="26" rx="38" ry="32" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="180" cy="18" rx="32" ry="28" fill="#208808"        className="mt-shimmer" />
              <ellipse cx="180" cy="6"  rx="22" ry="17" fill="#2a9c10"        className="mt-shimmer3" />
              {[{x:98,y:62,g:'mtFruitO'},{x:82,y:70,g:'mtFruitR'},{x:116,y:50,g:'mtFruitO'},
                {x:134,y:36,g:'mtFruitR'},{x:150,y:22,g:'mtFruitO'},{x:166,y:12,g:'mtFruitR'},
                {x:180,y:6,g:'mtFruitO'},{x:194,y:10,g:'mtFruitR'},{x:210,y:20,g:'mtFruitO'},
                {x:228,y:32,g:'mtFruitR'},{x:246,y:44,g:'mtFruitO'},{x:264,y:56,g:'mtFruitR'},
                {x:278,y:64,g:'mtFruitO'},{x:168,y:30,g:'mtFruitR'},{x:192,y:28,g:'mtFruitO'}].map(({x,y,g},i) => (
                <Fruit key={i} x={x} y={y} r={7} g={g} />
              ))}
              <rect x="130" y="127" width="100" height="8" fill="#c8a860" rx="2" opacity="0.9" />
              <g fill="#7B4E28">
                <rect x="152" y="118" width="56" height="5" rx="2" /><rect x="152" y="108" width="56" height="4" rx="2" />
                <rect x="162" y="108" width="5"  height="15" rx="1" /><rect x="194" y="108" width="5" height="15" rx="1" />
                <rect x="156" y="123" width="4"  height="9"  rx="1" /><rect x="200" y="123" width="4" height="9"  rx="1" />
              </g>
            </g>
          )}

          {/* ── STAGE 9: ancient golden-fruit tree ── */}
          {stage === 9 && (
            <g filter="url(#mtShadow)">
              <path d="M162 130 C156 104 156 78 158 50 L202 50 C204 78 204 104 198 130 Z" fill="url(#mtTrunk)" />
              {[66,80,96,112].map(y=>(
                <path key={y} d={`M165 ${y} Q180 ${y-6} 195 ${y}`} stroke="#6a3210" strokeWidth="1.6" fill="none" opacity="0.3" />
              ))}
              <path d="M164 123 C148 126 132 122 118 118" stroke="#8B4c20" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M196 123 C212 126 226 122 240 118" stroke="#8B4c20" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M165 90 C140 75 114 68 86 58"   stroke="#7a3c12" strokeWidth="6.5" fill="none" strokeLinecap="round" />
              <path d="M195 78 C220 63 248 54 278 44"  stroke="#7a3c12" strokeWidth="6.5" fill="none" strokeLinecap="round" />
              <ellipse cx="72"  cy="52" rx="38" ry="34" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="58"  cy="42" rx="26" ry="24" fill="#126000"        className="mt-shimmer2" />
              <ellipse cx="292" cy="38" rx="38" ry="34" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="306" cy="28" rx="24" ry="22" fill="#126000"        className="mt-shimmer3" />
              <ellipse cx="180" cy="32" rx="72" ry="60" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="150" cy="18" rx="46" ry="38" fill="url(#mtCrown3)" className="mt-shimmer" />
              <ellipse cx="210" cy="16" rx="44" ry="36" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="180" cy="8"  rx="38" ry="30" fill="#1a7208"        className="mt-shimmer" />
              <ellipse cx="180" cy="-2" rx="26" ry="20" fill="#229010"        className="mt-shimmer3" />
              {[{x:88,y:44,g:'mtFruitAu'},{x:72,y:56,g:'mtFruitO'},{x:106,y:36,g:'mtFruitAu'},
                {x:124,y:24,g:'mtFruitO'},{x:142,y:12,g:'mtFruitAu'},{x:158,y:4,g:'mtFruitO'},
                {x:180,y:-2,g:'mtFruitAu'},{x:202,y:2,g:'mtFruitO'},{x:218,y:10,g:'mtFruitAu'},
                {x:236,y:20,g:'mtFruitO'},{x:254,y:32,g:'mtFruitAu'},{x:272,y:42,g:'mtFruitO'},
                {x:298,y:34,g:'mtFruitAu'},{x:160,y:22,g:'mtFruitR'},{x:200,y:20,g:'mtFruitR'},
                {x:180,y:14,g:'mtFruitAu'}].map(({x,y,g},i) => (
                <Fruit key={i} x={x} y={y} r={7.5} g={g} />
              ))}
              <rect x="122" y="127" width="116" height="8" fill="#c8a860" rx="2" opacity="0.9" />
              <g fill="#7B4E28">
                <rect x="150" y="116" width="60" height="5" rx="2" /><rect x="150" y="106" width="60" height="4" rx="2" />
                <rect x="160" y="106" width="5"  height="15" rx="1" /><rect x="196" y="106" width="5" height="15" rx="1" />
              </g>
            </g>
          )}

          {/* ── STAGE 10: おすそわけの木 — golden gift tree ✨ ── */}
          {stage >= 10 && (
            <g filter="url(#mtShadow)">
              {/* Golden aura — animating */}
              <ellipse cx="180" cy="55" rx="110" ry="90" fill="url(#mtGlow)" className="mt-sparkle" />
              {/* Massive trunk */}
              <path d="M158 130 C151 100 151 70 154 44 L206 44 C209 70 209 100 202 130 Z" fill="url(#mtTrunk)" />
              {[58,74,90,108].map(y=>(
                <path key={y} d={`M162 ${y} Q180 ${y-7} 198 ${y}`} stroke="#6a3210" strokeWidth="1.8" fill="none" opacity="0.35" />
              ))}
              <path d="M160 122 C142 125 126 121 112 116" stroke="#8B4c20" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M200 122 C218 125 232 121 246 116" stroke="#8B4c20" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M162 82 C136 66 108 56 78 44"  stroke="#7a3c12" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M198 68 C224 52 254 42 286 32" stroke="#7a3c12" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M166 62 C152 46 144 30 140 14" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M194 54 C208 38 216 22 218 6"  stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
              <ellipse cx="62"  cy="38" rx="42" ry="36" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="46"  cy="28" rx="28" ry="26" fill="#0e5800"        className="mt-shimmer2" />
              <ellipse cx="302" cy="26" rx="42" ry="36" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="318" cy="16" rx="26" ry="24" fill="#0e5800"        className="mt-shimmer3" />
              <ellipse cx="146" cy="10" rx="30" ry="24" fill="#1a7010"        className="mt-shimmer" />
              <ellipse cx="216" cy="4"  rx="28" ry="22" fill="#1a7010"        className="mt-shimmer" />
              <ellipse cx="180" cy="22" rx="82" ry="66" fill="url(#mtCrown2)" className="mt-shimmer" />
              <ellipse cx="148" cy="8"  rx="52" ry="44" fill="url(#mtCrown3)" className="mt-shimmer2" />
              <ellipse cx="212" cy="6"  rx="50" ry="42" fill="url(#mtCrown3)" className="mt-shimmer3" />
              <ellipse cx="180" cy="-2" rx="42" ry="34" fill="#187208"        className="mt-shimmer" />
              {[{x:74,y:32,g:'mtFruitAu'},{x:58,y:42,g:'mtFruitO'},{x:90,y:22,g:'mtFruitAu'},
                {x:108,y:10,g:'mtFruitR'},{x:126,y:0,g:'mtFruitAu'},{x:144,y:-4,g:'mtFruitO'},
                {x:162,y:-6,g:'mtFruitAu'},{x:180,y:-8,g:'mtFruitR'},{x:198,y:-6,g:'mtFruitAu'},
                {x:216,y:-2,g:'mtFruitO'},{x:234,y:4,g:'mtFruitAu'},{x:252,y:14,g:'mtFruitR'},
                {x:270,y:24,g:'mtFruitAu'},{x:290,y:22,g:'mtFruitO'},{x:306,y:14,g:'mtFruitAu'},
                {x:160,y:12,g:'mtFruitR'},{x:180,y:8,g:'mtFruitAu'},{x:200,y:10,g:'mtFruitO'},
                {x:172,y:24,g:'mtFruitAu'},{x:188,y:22,g:'mtFruitR'}].map(({x,y,g},i) => (
                <Fruit key={i} x={x} y={y} r={8.5} g={g} />
              ))}
              {/* Golden sparkles — animated */}
              {[[90,16],[140,4],[180,-12],[220,2],[278,18],[152,20],[208,16],[180,30]].map(([x,y],i) => (
                <g key={i} className={i % 3 === 0 ? 'mt-sparkle' : i % 3 === 1 ? 'mt-sparkle2' : 'mt-sparkle3'}>
                  <path d={`M${x} ${y-6} L${x} ${y+6} M${x-6} ${y} L${x+6} ${y}`} stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
                  <path d={`M${x-4} ${y-4} L${x+4} ${y+4} M${x+4} ${y-4} L${x-4} ${y+4}`} stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                </g>
              ))}
              <rect x="118" y="127" width="124" height="8" fill="#c8a860" rx="2" opacity="0.9" />
              <g fill="#7B4E28">
                <rect x="148" y="116" width="64" height="5" rx="2" /><rect x="148" y="105" width="64" height="4" rx="2" />
                <rect x="158" y="105" width="5"  height="16" rx="1" /><rect x="198" y="105" width="5" height="16" rx="1" />
              </g>
            </g>
          )}
        </g>
        {/* END: wind-sway wrapper */}

        {/* ══ TIME indicator (clock icon) ════════════════════════════════════ */}
        <text x="8" y="12" fontSize="8" fill="rgba(255,255,255,0.55)"
          fontFamily="'Outfit','Noto Sans JP',sans-serif">
          {sky.isNight ? '🌙' : sky.isSunrise ? '🌅' : sky.isSunset ? '🌇' : '☀️'}
        </text>

        {/* ══ STAGE LABEL BAR ══════════════════════════════════════════════ */}
        <rect x="0" y="157" width="360" height="23" fill="rgba(0,0,0,0.22)" />
        <text x="180" y="173" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold"
          fontFamily="'Noto Sans JP', sans-serif">
          {TOWN_STAGES[stage].icon} {TOWN_STAGES[stage].name}　｜　おすそわけ {purchaseCount}回達成
        </text>
      </g>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function MyTown({ purchaseCount, fullPage = false }: MyTownProps) {
  const stage     = getTownStage(purchaseCount);
  const stageInfo = TOWN_STAGES[stage];
  const nextStage = stage < TOWN_STAGES.length - 1 ? TOWN_STAGES[stage + 1] : null;
  const finalStage = TOWN_STAGES[MAX_STAGE];
  const isMax = stage >= MAX_STAGE;

  const progressPct = nextStage
    ? Math.min(100, ((purchaseCount - stageInfo.minCount) / (nextStage.minCount - stageInfo.minCount)) * 100)
    : 100;

  // ── Level-up detection ─────────────────────────────────────────────────
  const [showPopup,    setShowPopup]    = useState(false);
  const [popupStage,   setPopupStage]   = useState(stage);
  const [showParticles, setShowParticles] = useState(false);
  const prevStageRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_KEY) ?? '-1', 10);
    if (stored === -1) {
      localStorage.setItem(LS_KEY, String(stage));
      prevStageRef.current = stage;
      return;
    }
    prevStageRef.current = stored;
    if (stage > stored) {
      setPopupStage(stage);
      setShowPopup(true);
      setShowParticles(true);
      localStorage.setItem(LS_KEY, String(stage));
      setTimeout(() => setShowParticles(false), 2500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const title = getTitle(stage);
  const gameFont = { fontFamily: "'Outfit', 'Noto Sans JP', sans-serif" };

  // ── Info panel ─────────────────────────────────────────────────────────
  const infoPanelCompact = (
    <div className="px-3 py-2.5">
      {/* Row 1: town name + level badge + stage number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-black text-foreground" style={gameFont}>🏘️ マイタウン</span>
          <motion.span
            key={stage}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none"
            style={gameFont}
          >
            Lv.{stage}
          </motion.span>
          <span className="text-primary text-[10px] font-bold truncate" style={gameFont}>{title}</span>
        </div>
        <div className="flex items-baseline gap-0.5 shrink-0 ml-2">
          <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wide mr-0.5">STAGE</span>
          <motion.span
            key={stage}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="text-lg font-black text-primary leading-none"
            style={gameFont}
          >
            {stage}
          </motion.span>
          <span className="text-[9px] text-muted-foreground font-bold">/{MAX_STAGE}</span>
        </div>
      </div>

      {/* Row 2: progress + next stage */}
      {!isMax ? (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(3, progressPct)}%` }}
                transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
              {nextStage!.icon} {nextStage!.name} まであと<span className="font-black text-foreground">{nextStage!.minCount - purchaseCount}</span>回
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
            ✨ <span className="text-foreground/70">{nextStage!.benefit}</span>
          </p>
        </div>
      ) : (
        <p className="text-[10px] font-bold text-emerald-600 mt-1.5" style={gameFont}>
          🌟 最高ステージ達成！{stageInfo.benefit}
        </p>
      )}
    </div>
  );

  // ── Full-page info panel ─────────────────────────────────────────────────
  const infoPanelFull = (
    <div className="px-4 pt-4 pb-5">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex-1 min-w-0">
          <motion.div key={stage} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide" style={gameFont}>Lv.{stage}</span>
            <span className="font-black text-primary text-sm" style={gameFont}>{title}</span>
          </motion.div>
          <h3 className="font-black text-foreground text-lg flex items-center gap-1" style={gameFont}>🏘️ マイタウン</h3>
          <p className="text-muted-foreground text-sm mt-0 leading-snug">{stageInfo.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wide">STAGE</div>
          <motion.div key={stage} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="font-black text-primary leading-none text-5xl" style={gameFont}>{stage}</motion.div>
          <div className="text-[8px] text-muted-foreground">/ {MAX_STAGE}</div>
        </div>
      </div>
      {!isMax ? (
        <>
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-muted-foreground font-medium text-xs">次: {nextStage!.icon} {nextStage!.name}</span>
              <span className="font-black text-foreground text-xs">あと {nextStage!.minCount - purchaseCount}回</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative bg-secondary rounded-full overflow-hidden h-4">
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e, #16a34a)' }}
                  initial={{ width: 0 }} animate={{ width: `${Math.max(4, progressPct)}%` }} transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }} />
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              </div>
              <div className="flex flex-col items-center shrink-0 opacity-35">
                <span className="text-xs leading-none">{finalStage.icon[0]}</span>
                <span className="text-[8px] font-black text-muted-foreground whitespace-nowrap">Lv.{MAX_STAGE}</span>
              </div>
            </div>
          </div>
          <motion.div className="bg-secondary/60 rounded-xl px-2.5 py-1.5" whileTap={{ scale: 0.97 }}>
            <p className="text-muted-foreground leading-snug text-sm">
              あと <span className="font-black text-foreground" style={gameFont}>{nextStage!.minCount - purchaseCount}回</span> おすそわけすると「{nextStage!.name}」に進化！🌿
            </p>
            <p className="text-primary font-bold mt-0.5 flex items-center gap-1 text-sm">
              <span>✨</span><span className="text-foreground font-semibold">{nextStage!.benefit}</span>
            </p>
          </motion.div>
        </>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
          <p className="font-black text-emerald-700 text-base" style={gameFont}>🌟 最高ステージ達成！フードロス・ヒーロー</p>
          <p className="text-emerald-600 mt-1 text-sm">{stageInfo.benefit}</p>
        </div>
      )}
    </div>
  );

  const infoPanel = fullPage ? infoPanelFull : infoPanelCompact;

  // ── Full-page mode ──────────────────────────────────────────────────────
  if (fullPage) {
    return (
      <>
        <AnimatePresence>
          {showPopup && <EvolutionPopup stage={popupStage} onClose={() => setShowPopup(false)} />}
        </AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col flex-1 w-full"
        >
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <TownScene stage={stage} purchaseCount={purchaseCount} tall fillHeight showLevelUp={showParticles} />
            <LevelUpParticles active={showParticles} />
          </div>
          <div className="bg-card border-t border-border shadow-sm shrink-0">
            {infoPanel}
          </div>
        </motion.div>
      </>
    );
  }

  // ── Card mode ───────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {showPopup && <EvolutionPopup stage={popupStage} onClose={() => setShowPopup(false)} />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-3"
      >
        <div className="relative overflow-hidden" style={{ height: 130 }}>
          <TownScene stage={stage} purchaseCount={purchaseCount} showLevelUp={showParticles} fillHeight />
          <LevelUpParticles active={showParticles} />
        </div>
        {infoPanel}
      </motion.div>
    </>
  );
}
