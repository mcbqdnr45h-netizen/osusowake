import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getTownStage, TOWN_STAGES, MAX_STAGE } from '@/lib/town-stage';

interface MyTownProps {
  purchaseCount: number;
  fullPage?: boolean;
}

const LS_KEY = 'rescueat_mytownStage';

// ── 称号テーブル（Lv 0〜10）──────────────────────────────────────────────
const TITLES: Record<number, string> = {
  0:  '見習い市民',
  1:  '新米市長',
  2:  '若葉の守り手',
  3:  '芽吹きの使者',
  4:  '緑の開拓者',
  5:  'レスキュー隊長',
  6:  '森の守護者',
  7:  '収穫の達人',
  8:  '環境の英雄',
  9:  '伝説の守り手',
  10: 'フードロス・ヒーロー',
};

function getTitle(stage: number) {
  return TITLES[Math.min(stage, MAX_STAGE)] ?? TITLES[MAX_STAGE];
}

// ── Confetti 発火 ──────────────────────────────────────────────────────────
function fireConfetti() {
  const colors = ['#FF8C00', '#FFD700', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#fff'];
  const shared = { particleCount: 60, spread: 80, colors, startVelocity: 45, gravity: 0.9 };
  confetti({ ...shared, origin: { x: 0.25, y: 0.55 }, angle: 60 });
  confetti({ ...shared, origin: { x: 0.75, y: 0.55 }, angle: 120 });
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, colors, origin: { x: 0.5, y: 0.4 }, gravity: 0.7 });
  }, 250);
}

// ── Evolution Popup ────────────────────────────────────────────────────────
function EvolutionPopup({ stage, onClose }: { stage: number; onClose: () => void }) {
  const info = TOWN_STAGES[stage];
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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 backdrop-blur-sm px-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 16, stiffness: 280 }}
        className="relative bg-card border-2 border-primary/40 rounded-[2rem] shadow-2xl p-7 max-w-sm w-full text-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 背景グロー */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        {/* LEVEL UP! バウンス見出し */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: [0, 1.35, 0.95, 1.1, 1], rotate: [0, 4, -3, 2, 0] }}
          transition={{ delay: 0.05, duration: 0.7, times: [0, 0.4, 0.6, 0.8, 1] }}
          className="mb-3"
        >
          <span
            className="inline-block text-3xl font-black tracking-widest text-transparent"
            style={{
              fontFamily: "'Outfit', 'Noto Sans JP', sans-serif",
              background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              letterSpacing: '0.12em',
            }}
          >
            LEVEL UP!
          </span>
        </motion.div>

        {/* アイコン */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{ delay: 0.2, times: [0, 0.6, 1], duration: 0.5 }}
          className="text-6xl mb-3 leading-none"
        >
          {info.icon}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {/* ステージ + 称号 */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="bg-primary text-primary-foreground text-xs font-black px-2.5 py-0.5 rounded-full">
              Lv.{stage}
            </span>
            <span className="text-sm font-black text-primary" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {title}
            </span>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: "'Outfit', 'Noto Sans JP', sans-serif" }}>
            「{info.name}」
          </h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{info.description}</p>

          {/* 解放メッセージ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-primary/15 to-yellow-400/10 border border-primary/25 rounded-2xl px-4 py-3 mb-5"
          >
            <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">🎁 解放されました！</p>
            <p className="text-sm font-bold text-foreground leading-snug">{info.benefit}</p>
          </motion.div>

          {/* ボタン */}
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="w-full bg-primary text-primary-foreground font-black py-3.5 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors text-sm"
            style={{ fontFamily: "'Outfit', 'Noto Sans JP', sans-serif" }}
          >
            やったー！続けよう 🌿
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── SVG Town Scene helper ──────────────────────────────────────────────────
function TownScene({ stage, purchaseCount, tall = false, fillHeight = false }: { stage: number; purchaseCount: number; tall?: boolean; fillHeight?: boolean }) {
  const ge = (n: number) => stage >= n;
  const shift = tall ? 60 : 0;
  const viewH = tall ? 240 : 180;

  const skyColors: [string, string][] = [
    ['#a8a098', '#cec8be'], // 0
    ['#b0cce0', '#daeef8'], // 1
    ['#90bcd8', '#cce8f8'], // 2
    ['#70acd0', '#b8e0f4'], // 3
    ['#4e9ec8', '#a0d4ee'], // 4
    ['#3a8ec0', '#88c8ec'], // 5
    ['#2878b4', '#70b4e8'], // 6
    ['#1a68aa', '#58a0e4'], // 7
    ['#0e589e', '#4090d8'], // 8
    ['#0a4c8e', '#3080cc'], // 9
    ['#083878', '#2070b8'], // 10
  ];
  const groundColors = ['#7a5818','#8a6e28','#5a8e20','#429018','#308010','#226808','#146000','#0e5400','#0a4800','#083c00','#063200'];
  const [skyTop, skyBot] = skyColors[Math.min(stage, 10)];
  const groundColor = groundColors[Math.min(stage, 10)];
  const groundTop = stage >= 2 ? '#6aaa28' : stage >= 1 ? '#7a9428' : groundColor;

  /* ── fruit helper ── */
  const Fruit = ({ x, y, r = 6, g = 'mtFruitO' }: { x: number; y: number; r?: number; g?: string }) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${g})`} />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.35} rx={r * 0.35} ry={r * 0.25} fill="white" opacity="0.5" />
      <path d={`M${x} ${y - r} Q${x + 2} ${y - r - 4} ${x + 3} ${y - r - 6}`} stroke="#3a7820" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  );

  /* ── flower helper ── */
  const Flower = ({ x, y, c = '#ffb8d8', r = 5 }: { x: number; y: number; c?: string; r?: number }) => (
    <g>
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a}
          cx={x + r * Math.cos((a * Math.PI) / 180)}
          cy={y + r * Math.sin((a * Math.PI) / 180)}
          rx={r * 0.65} ry={r * 0.45}
          transform={`rotate(${a} ${x + r * Math.cos((a * Math.PI) / 180)} ${y + r * Math.sin((a * Math.PI) / 180)})`}
          fill={c} />
      ))}
      <circle cx={x} cy={y} r={r * 0.45} fill="#FFE840" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 360 ${viewH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={fillHeight ? 'xMidYMax slice' : 'xMidYMid meet'}
      style={fillHeight ? { display: 'block', width: '100%', height: '100%' } : { display: 'block', width: '100%' }}
      aria-label={`マイタウン: ${TOWN_STAGES[stage].name}`}
    >
      <defs>
        {/* Sky / Ground */}
        <linearGradient id="mtSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} /><stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="mtGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={groundTop} /><stop offset="100%" stopColor={groundColor} />
        </linearGradient>

        {/* Leaf gradients – light top, rich mid, deep bottom */}
        <linearGradient id="mtLeaf1" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#b8f060" />
          <stop offset="45%" stopColor="#72cc28" />
          <stop offset="100%" stopColor="#48980c" />
        </linearGradient>
        <linearGradient id="mtLeaf2" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#90dc48" />
          <stop offset="50%" stopColor="#54b018" />
          <stop offset="100%" stopColor="#308800" />
        </linearGradient>
        <linearGradient id="mtLeaf3" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#68c030" />
          <stop offset="55%" stopColor="#389808" />
          <stop offset="100%" stopColor="#1e6000" />
        </linearGradient>

        {/* Trunk */}
        <linearGradient id="mtTrunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a3c10" />
          <stop offset="35%" stopColor="#a05a28" />
          <stop offset="100%" stopColor="#6a3210" />
        </linearGradient>

        {/* Crown radial */}
        <radialGradient id="mtCrown1" cx="42%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#8ae050" />
          <stop offset="55%" stopColor="#4ab818" />
          <stop offset="100%" stopColor="#247800" />
        </radialGradient>
        <radialGradient id="mtCrown2" cx="40%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#60c038" />
          <stop offset="55%" stopColor="#309808" />
          <stop offset="100%" stopColor="#146000" />
        </radialGradient>
        <radialGradient id="mtCrown3" cx="40%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#44a828" />
          <stop offset="55%" stopColor="#207800" />
          <stop offset="100%" stopColor="#0c4800" />
        </radialGradient>

        {/* Fruits */}
        <radialGradient id="mtFruitO" cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffd060" /><stop offset="100%" stopColor="#e07000" />
        </radialGradient>
        <radialGradient id="mtFruitR" cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ff9090" /><stop offset="100%" stopColor="#c41818" />
        </radialGradient>
        <radialGradient id="mtFruitG" cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#d8f840" /><stop offset="100%" stopColor="#88b800" />
        </radialGradient>
        <radialGradient id="mtFruitAu" cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#fff080" /><stop offset="100%" stopColor="#d4a000" />
        </radialGradient>

        {/* Petal */}
        <radialGradient id="mtPetal" cx="50%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#fff0f8" /><stop offset="100%" stopColor="#ffb0d0" />
        </radialGradient>

        {/* Golden aura for stage 10 */}
        <radialGradient id="mtGlow" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
        </radialGradient>

        {/* Drop-shadow filter */}
        <filter id="mtShadow" x="-20%" y="-15%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1a4000" floodOpacity="0.22" />
        </filter>
        <filter id="mtShadowSm" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1a4000" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect x="0" y="0" width="360" height={viewH} fill="url(#mtSky)" />
      {shift > 0 && <rect x="0" y="0" width="360" height={shift} fill={skyTop} />}

      <g transform={shift ? `translate(0, ${shift})` : undefined}>

        {/* Sun (stage 4+) */}
        {ge(4) && (
          <g>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
              <line key={a}
                x1={308 + 21 * Math.cos(a * Math.PI / 180)} y1={28 + 21 * Math.sin(a * Math.PI / 180)}
                x2={308 + 30 * Math.cos(a * Math.PI / 180)} y2={28 + 30 * Math.sin(a * Math.PI / 180)}
                stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
            ))}
            <circle cx="308" cy="28" r="17" fill="#FFE840" opacity="0.95" />
            <circle cx="308" cy="28" r="12" fill="#FFF8B0" />
          </g>
        )}

        {/* Stars (stage 0-1) */}
        {stage <= 1 && (
          <g fill="#fff" opacity="0.7">
            {[[30,20],[80,12],[140,18],[200,8],[260,22],[320,15],[170,30],[50,35]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="1.3" />
            ))}
          </g>
        )}

        {/* Clouds (stage 3+) */}
        {ge(3) && (
          <g opacity="0.92">
            <ellipse cx="72" cy="34" rx="26" ry="12" fill="white" />
            <ellipse cx="52" cy="38" rx="17" ry="10" fill="white" />
            <ellipse cx="92" cy="37" rx="19" ry="9" fill="white" />
            <ellipse cx="254" cy="42" rx="23" ry="11" fill="white" />
            <ellipse cx="238" cy="46" rx="15" ry="9" fill="white" />
            <ellipse cx="272" cy="45" rx="16" ry="8" fill="white" />
          </g>
        )}

        {/* Birds (stage 7+) */}
        {ge(7) && (
          <g fill="none" stroke="#1e3858" strokeWidth="1.5" strokeLinecap="round">
            <path d="M36,24 Q41,18 46,24" /><path d="M52,17 Q57,11 62,17" />
            <path d="M174,20 Q179,14 184,20" /><path d="M190,28 Q195,22 200,28" />
          </g>
        )}

        {/* Background city (stage 9+) */}
        {ge(9) && (
          <g opacity="0.38">
            <rect x="4" y="66" width="26" height="64" fill="#7090a8" rx="2" />
            <rect x="10" y="74" width="6" height="5" fill="#b0d8ee" rx="1" />
            <rect x="18" y="74" width="6" height="5" fill="#b0d8ee" rx="1" />
            <rect x="4" y="52" width="18" height="78" fill="#8098b4" rx="1" />
            <rect x="324" y="70" width="28" height="60" fill="#7090a8" rx="2" />
            <rect x="330" y="78" width="6" height="5" fill="#b0d8ee" rx="1" />
            <rect x="340" y="78" width="6" height="5" fill="#b0d8ee" rx="1" />
            <rect x="334" y="56" width="20" height="74" fill="#8098b4" rx="1" />
          </g>
        )}

        {/* ── Ground ── */}
        <rect x="0" y="130" width="360" height="50" fill="url(#mtGround)" />

        {/* Cracks (stage 0) */}
        {stage === 0 && (
          <g stroke="#5a3808" strokeWidth="1.5" fill="none" opacity="0.6">
            <path d="M48,134 L60,144 L54,154" />
            <path d="M148,132 L164,142 L154,152 L170,158" />
            <path d="M256,136 L268,145 L262,153" />
          </g>
        )}

        {/* Litter (stage 0-1) */}
        {stage <= 1 && (
          <g opacity={stage === 0 ? 1 : 0.4}>
            <rect x="48" y="125" width="16" height="8" fill="#888" rx="2" />
            <rect x="52" y="123" width="8" height="4" fill="#aaa" rx="1" />
            <rect x="192" y="127" width="20" height="5" fill="#bc8888" rx="1" />
            <rect x="290" y="125" width="12" height="7" fill="#aaa" rx="1" />
          </g>
        )}

        {/* Grass blades (stage 3+) */}
        {ge(3) && (
          <g opacity="0.9">
            {[16,34,50,68,86,108,132,212,236,258,278,298,316,334].map(x => (
              <g key={x} fill="#4aaa20">
                <path d={`M${x} 130 C${x-1} 124 ${x-2} 119 ${x-1} 115 C${x} 120 ${x+2} 125 ${x+2} 130`} />
                <path d={`M${x+5} 130 C${x+4} 123 ${x+6} 117 ${x+6} 113 C${x+7} 118 ${x+8} 124 ${x+8} 130`} />
                <path d={`M${x+10} 130 C${x+9} 126 ${x+11} 122 ${x+11} 118 C${x+12} 122 ${x+13} 126 ${x+13} 130`} />
              </g>
            ))}
          </g>
        )}

        {/* Ground flowers / small plants (stage 5+) */}
        {ge(5) && (
          <g>
            {[{x:44,c:'#ff78b0'},{x:56,c:'#ffcc30'},{x:100,c:'#ff78b0'},{x:112,c:'#cc44ff'},
              {x:228,c:'#ffcc30'},{x:240,c:'#ff78b0'},{x:282,c:'#cc44ff'},{x:294,c:'#ffcc30'}].map(({x,c},i) => (
              <Flower key={i} x={x} y={127} c={c} r={5} />
            ))}
          </g>
        )}

        {/* Side trees L (stage 4+) */}
        {ge(4) && (
          <g filter="url(#mtShadowSm)" opacity="0.88">
            <path d="M76 130 C75 118 75 108 76 100 L85 100 C86 108 86 118 85 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="80" cy="92" rx="20" ry="24" fill="url(#mtCrown2)" />
            <ellipse cx="70" cy="98" rx="13" ry="14" fill="url(#mtCrown1)" />
            <ellipse cx="90" cy="96" rx="12" ry="13" fill="url(#mtCrown1)" />
            <ellipse cx="80" cy="76" rx="14" ry="16" fill="url(#mtLeaf1)" />
          </g>
        )}

        {/* Side trees R (stage 4+) */}
        {ge(4) && (
          <g filter="url(#mtShadowSm)" opacity="0.88">
            <path d="M256 130 C255 116 255 104 256 94 L268 94 C269 104 269 116 268 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="262" cy="84" rx="24" ry="28" fill="url(#mtCrown2)" />
            <ellipse cx="252" cy="92" rx="14" ry="16" fill="url(#mtCrown1)" />
            <ellipse cx="274" cy="90" rx="13" ry="15" fill="url(#mtCrown1)" />
            <ellipse cx="262" cy="66" rx="16" ry="18" fill="url(#mtLeaf1)" />
          </g>
        )}

        {/* Extra deep-forest side trees (stage 8+) */}
        {ge(8) && (
          <g opacity="0.75">
            <path d="M26 130 C25 118 25 104 26 90 L34 90 C35 104 35 118 34 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="30" cy="82" rx="18" ry="20" fill="#145000" />
            <ellipse cx="30" cy="68" rx="13" ry="15" fill="#1a6408" />
            <path d="M318 130 C317 116 317 102 318 88 L327 88 C328 102 328 116 327 130 Z" fill="url(#mtTrunk)" />
            <ellipse cx="322" cy="80" rx="19" ry="22" fill="#145000" />
            <ellipse cx="322" cy="65" rx="14" ry="16" fill="#1a6408" />
          </g>
        )}

        {/* ══════════════════════════════════════════════
            CENTER PLANT — main visual, grows with stage
            ══════════════════════════════════════════════ */}

        {/* Stage 1: cute seedling with smooth bezier cotyledons */}
        {stage === 1 && (
          <g filter="url(#mtShadowSm)">
            {/* Stem – slight organic curve */}
            <path d="M180 130 C179 122 181 116 180 108" stroke="#4a9020" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Left cotyledon */}
            <path d="M180 112 C171 109 164 102 168 95 C172 89 179 95 180 105" fill="url(#mtLeaf1)" />
            {/* Right cotyledon */}
            <path d="M180 112 C189 109 196 102 192 95 C188 89 181 95 180 105" fill="url(#mtLeaf1)" />
            {/* Midrib veins */}
            <path d="M180 112 L170 97" stroke="#388018" strokeWidth="0.9" fill="none" opacity="0.55" />
            <path d="M180 112 L190 97" stroke="#388018" strokeWidth="0.9" fill="none" opacity="0.55" />
            {/* Dew drop */}
            <ellipse cx="168" cy="94" rx="2.2" ry="2.8" fill="#88eeff" opacity="0.75" />
            {/* Soil mound */}
            <path d="M173 130 Q180 126 187 130" fill="#5a3c10" opacity="0.35" />
          </g>
        )}

        {/* Stage 2: taller seedling, 4 leaves */}
        {stage === 2 && (
          <g filter="url(#mtShadowSm)">
            <path d="M180 130 C178 119 182 108 180 98" stroke="#489820" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Lower leaves */}
            <path d="M180 120 C170 117 162 108 167 100 C172 93 179 100 180 112" fill="url(#mtLeaf1)" />
            <path d="M180 120 C190 117 198 108 193 100 C188 93 181 100 180 112" fill="url(#mtLeaf1)" />
            {/* Upper leaves */}
            <path d="M180 104 C170 100 162 92 167 85 C172 78 180 86 180 97" fill="url(#mtLeaf2)" />
            <path d="M180 104 C190 100 198 92 193 85 C188 78 180 86 180 97" fill="url(#mtLeaf2)" />
            {/* Apical bud */}
            <ellipse cx="180" cy="96" rx="5" ry="6" fill="#8ee040" />
            <ellipse cx="180" cy="93" rx="3.5" ry="3.5" fill="#b0f060" />
            {/* Veins */}
            <path d="M180 120 L169 103" stroke="#388018" strokeWidth="0.8" fill="none" opacity="0.45" />
            <path d="M180 120 L191 103" stroke="#388018" strokeWidth="0.8" fill="none" opacity="0.45" />
          </g>
        )}

        {/* Stage 3: young branching plant */}
        {stage === 3 && (
          <g filter="url(#mtShadowSm)">
            {/* Main stem */}
            <path d="M180 130 C178 115 182 100 180 88" stroke="#3a9018" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Side branches */}
            <path d="M180 116 C172 110 162 107 154 102" stroke="#4aa020" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M180 108 C188 102 198 99 206 94" stroke="#4aa020" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Left branch leaves */}
            <path d="M154 102 C145 96 141 87 148 81 C155 75 161 84 157 94" fill="url(#mtLeaf1)" />
            <path d="M154 102 C147 108 143 118 150 122 C157 125 161 115 157 104" fill="url(#mtLeaf2)" />
            {/* Right branch leaves */}
            <path d="M206 94 C215 88 219 79 212 73 C205 67 199 76 203 87" fill="url(#mtLeaf1)" />
            <path d="M206 94 C215 100 218 111 211 114 C204 117 200 108 204 97" fill="url(#mtLeaf2)" />
            {/* Top leaves */}
            <path d="M180 88 C171 84 164 75 170 68 C176 62 182 70 181 81" fill="url(#mtLeaf2)" />
            <path d="M180 88 C189 84 196 75 190 68 C184 62 178 70 179 81" fill="url(#mtLeaf2)" />
            {/* Tip bud cluster */}
            <ellipse cx="180" cy="86" rx="7" ry="8" fill="url(#mtLeaf1)" />
            <ellipse cx="180" cy="82" rx="4.5" ry="4.5" fill="#b0f050" />
          </g>
        )}

        {/* Stage 4: small round-crowned sapling */}
        {stage === 4 && (
          <g filter="url(#mtShadow)">
            {/* Trunk */}
            <path d="M175 130 C173 117 173 104 174 94 L186 94 C187 104 187 117 185 130 Z" fill="url(#mtTrunk)" />
            <path d="M177 128 C177 110 177 100 177 95" stroke="#6a3210" strokeWidth="1" fill="none" opacity="0.4" />
            <path d="M183 128 C183 110 183 100 183 95" stroke="#6a3210" strokeWidth="1" fill="none" opacity="0.4" />
            {/* Side branches */}
            <path d="M176 110 C165 103 152 99 142 93" stroke="#8B4C22" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M184 104 C195 97 208 93 218 87" stroke="#8B4C22" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* Left cluster */}
            <ellipse cx="136" cy="87" rx="22" ry="18" fill="url(#mtCrown1)" />
            <ellipse cx="128" cy="80" rx="15" ry="12" fill="url(#mtLeaf2)" />
            <ellipse cx="146" cy="79" rx="13" ry="11" fill="url(#mtLeaf2)" />
            {/* Right cluster */}
            <ellipse cx="224" cy="81" rx="22" ry="18" fill="url(#mtCrown1)" />
            <ellipse cx="216" cy="74" rx="14" ry="12" fill="url(#mtLeaf2)" />
            <ellipse cx="234" cy="76" rx="13" ry="11" fill="url(#mtLeaf2)" />
            {/* Main crown */}
            <ellipse cx="180" cy="78" rx="30" ry="24" fill="url(#mtCrown1)" />
            <ellipse cx="168" cy="68" rx="19" ry="16" fill="url(#mtCrown2)" />
            <ellipse cx="192" cy="66" rx="18" ry="15" fill="url(#mtCrown2)" />
            <ellipse cx="180" cy="58" rx="18" ry="15" fill="url(#mtLeaf1)" />
          </g>
        )}

        {/* Stage 5: flowering spring tree */}
        {stage === 5 && (
          <g filter="url(#mtShadow)">
            {/* Trunk */}
            <path d="M173 130 C171 114 171 98 172 84 L188 84 C189 98 189 114 187 130 Z" fill="url(#mtTrunk)" />
            {/* Branches */}
            <path d="M174 106 C161 98 148 94 136 87" stroke="#8B4C22" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M186 98 C199 90 212 85 224 78" stroke="#8B4C22" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Side clusters */}
            <ellipse cx="128" cy="81" rx="26" ry="21" fill="url(#mtCrown1)" />
            <ellipse cx="118" cy="73" rx="17" ry="14" fill="url(#mtCrown2)" />
            <ellipse cx="140" cy="72" rx="16" ry="13" fill="url(#mtCrown2)" />
            <ellipse cx="232" cy="72" rx="26" ry="21" fill="url(#mtCrown1)" />
            <ellipse cx="222" cy="64" rx="16" ry="13" fill="url(#mtCrown2)" />
            <ellipse cx="244" cy="66" rx="15" ry="13" fill="url(#mtCrown2)" />
            {/* Main crown */}
            <ellipse cx="180" cy="66" rx="38" ry="32" fill="url(#mtCrown1)" />
            <ellipse cx="163" cy="54" rx="24" ry="20" fill="url(#mtCrown2)" />
            <ellipse cx="197" cy="52" rx="22" ry="19" fill="url(#mtCrown2)" />
            <ellipse cx="180" cy="44" rx="22" ry="18" fill="url(#mtLeaf1)" />
            {/* Flowers on crown */}
            {[{x:120,y:76,c:'#ffb8d8'},{x:134,y:84,c:'#ffd8e8'},{x:148,y:72,c:'#ffb8d8'},
              {x:162,y:60,c:'#ffd8f0'},{x:174,y:50,c:'#ffb8d8'},{x:192,y:48,c:'#ffd8e8'},
              {x:206,y:58,c:'#ffb8d8'},{x:222,y:68,c:'#ffd8f0'},{x:236,y:76,c:'#ffb8d8'}].map(({x,y,c},i) => (
              <Flower key={i} x={x} y={y} c={c} r={5.5} />
            ))}
          </g>
        )}

        {/* Stage 6: lush dense green tree */}
        {stage === 6 && (
          <g filter="url(#mtShadow)">
            {/* Trunk */}
            <path d="M171 130 C168 112 168 94 170 76 L190 76 C192 94 192 112 189 130 Z" fill="url(#mtTrunk)" />
            {[88,101,114,125].map(y=>(
              <path key={y} d={`M173 ${y} Q180 ${y-4} 187 ${y}`} stroke="#6a3210" strokeWidth="1.2" fill="none" opacity="0.3" />
            ))}
            {/* Branches */}
            <path d="M173 108 C157 100 141 96 126 88" stroke="#7a3c12" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M187 100 C203 92 219 87 236 80" stroke="#7a3c12" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {/* Far clusters */}
            <ellipse cx="116" cy="82" rx="28" ry="24" fill="url(#mtCrown2)" />
            <ellipse cx="106" cy="72" rx="18" ry="16" fill="url(#mtCrown3)" />
            <ellipse cx="246" cy="74" rx="28" ry="24" fill="url(#mtCrown2)" />
            <ellipse cx="256" cy="64" rx="18" ry="15" fill="url(#mtCrown3)" />
            {/* Main crown layers */}
            <ellipse cx="180" cy="58" rx="48" ry="40" fill="url(#mtCrown2)" />
            <ellipse cx="160" cy="46" rx="30" ry="26" fill="url(#mtCrown3)" />
            <ellipse cx="200" cy="44" rx="28" ry="24" fill="url(#mtCrown3)" />
            <ellipse cx="180" cy="36" rx="26" ry="22" fill="#339010" />
            <ellipse cx="180" cy="24" rx="18" ry="16" fill="#3aa818" />
          </g>
        )}

        {/* Stage 7: fruiting tree — food rescue theme 🍊🍎 */}
        {stage === 7 && (
          <g filter="url(#mtShadow)">
            {/* Trunk */}
            <path d="M169 130 C165 109 165 88 167 68 L193 68 C195 88 195 109 191 130 Z" fill="url(#mtTrunk)" />
            {[82,96,110,122].map(y=>(
              <path key={y} d={`M171 ${y} Q180 ${y-5} 189 ${y}`} stroke="#6a3210" strokeWidth="1.3" fill="none" opacity="0.3" />
            ))}
            {/* Surface roots */}
            <path d="M170 127 C158 129 146 126 138 123" stroke="#8B4c20" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M190 127 C202 129 214 126 222 123" stroke="#8B4c20" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Branches */}
            <path d="M171 104 C152 93 132 88 112 80" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M189 96 C208 85 228 79 250 72" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Far clusters */}
            <ellipse cx="102" cy="74" rx="30" ry="26" fill="url(#mtCrown2)" />
            <ellipse cx="92" cy="64" rx="20" ry="18" fill="url(#mtCrown3)" />
            <ellipse cx="262" cy="66" rx="30" ry="26" fill="url(#mtCrown2)" />
            <ellipse cx="272" cy="56" rx="20" ry="17" fill="url(#mtCrown3)" />
            {/* Main crown */}
            <ellipse cx="180" cy="50" rx="54" ry="46" fill="url(#mtCrown2)" />
            <ellipse cx="156" cy="38" rx="34" ry="30" fill="url(#mtCrown3)" />
            <ellipse cx="204" cy="36" rx="32" ry="28" fill="url(#mtCrown3)" />
            <ellipse cx="180" cy="28" rx="28" ry="24" fill="#289808" />
            <ellipse cx="180" cy="16" rx="20" ry="16" fill="#2eae10" />
            {/* Fruits 🍊🍎 */}
            {[{x:116,y:72,g:'mtFruitO'},{x:100,y:78,g:'mtFruitR'},{x:136,y:48,g:'mtFruitO'},
              {x:150,y:34,g:'mtFruitR'},{x:166,y:22,g:'mtFruitO'},{x:180,y:14,g:'mtFruitR'},
              {x:194,y:20,g:'mtFruitO'},{x:210,y:32,g:'mtFruitR'},{x:226,y:46,g:'mtFruitO'},
              {x:244,y:60,g:'mtFruitR'},{x:260,y:70,g:'mtFruitO'},{x:170,y:38,g:'mtFruitR'},
              {x:190,y:36,g:'mtFruitO'}].map(({x,y,g},i) => (
              <Fruit key={i} x={x} y={y} r={6.5} g={g} />
            ))}
            {/* Walkway */}
            <rect x="136" y="127" width="88" height="8" fill="#c8a860" rx="2" opacity="0.9" />
            {[136,156,176,196].map(x=>(
              <rect key={x} x={x} y="127" width="18" height="8" fill="none" stroke="#b49038" strokeWidth="0.5" rx="1" opacity="0.6" />
            ))}
            {/* Bench */}
            <g fill="#7B4E28">
              <rect x="156" y="118" width="48" height="5" rx="2" /><rect x="156" y="109" width="48" height="4" rx="2" />
              <rect x="166" y="109" width="4" height="14" rx="1" /><rect x="192" y="109" width="4" height="14" rx="1" />
              <rect x="160" y="123" width="4" height="9" rx="1" /><rect x="196" y="123" width="4" height="9" rx="1" />
            </g>
          </g>
        )}

        {/* Stage 8: large majestic tree */}
        {stage === 8 && (
          <g filter="url(#mtShadow)">
            <path d="M166 130 C161 107 161 84 163 60 L197 60 C199 84 199 107 194 130 Z" fill="url(#mtTrunk)" />
            {[76,90,104,118].map(y=>(
              <path key={y} d={`M169 ${y} Q180 ${y-5} 191 ${y}`} stroke="#6a3210" strokeWidth="1.4" fill="none" opacity="0.3" />
            ))}
            <path d="M167 125 C152 128 138 124 126 120" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M193 125 C208 128 222 124 234 120" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M168 104 C147 91 126 85 104 76" stroke="#7a3c12" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <path d="M192 92 C213 79 234 72 258 63" stroke="#7a3c12" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <ellipse cx="90" cy="70" rx="34" ry="30" fill="url(#mtCrown3)" />
            <ellipse cx="78" cy="60" rx="22" ry="20" fill="#166000" />
            <ellipse cx="272" cy="57" rx="34" ry="30" fill="url(#mtCrown3)" />
            <ellipse cx="284" cy="47" rx="22" ry="19" fill="#166000" />
            <ellipse cx="180" cy="42" rx="62" ry="54" fill="url(#mtCrown2)" />
            <ellipse cx="154" cy="28" rx="40" ry="34" fill="url(#mtCrown3)" />
            <ellipse cx="206" cy="26" rx="38" ry="32" fill="url(#mtCrown3)" />
            <ellipse cx="180" cy="18" rx="32" ry="28" fill="#208808" />
            <ellipse cx="180" cy="6" rx="22" ry="17" fill="#2a9c10" />
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
              <rect x="162" y="108" width="5" height="15" rx="1" /><rect x="194" y="108" width="5" height="15" rx="1" />
              <rect x="156" y="123" width="4" height="9" rx="1" /><rect x="200" y="123" width="4" height="9" rx="1" />
            </g>
          </g>
        )}

        {/* Stage 9: ancient lush tree with golden fruit */}
        {stage === 9 && (
          <g filter="url(#mtShadow)">
            <path d="M162 130 C156 104 156 78 158 50 L202 50 C204 78 204 104 198 130 Z" fill="url(#mtTrunk)" />
            {[66,80,96,112].map(y=>(
              <path key={y} d={`M165 ${y} Q180 ${y-6} 195 ${y}`} stroke="#6a3210" strokeWidth="1.6" fill="none" opacity="0.3" />
            ))}
            <path d="M164 123 C148 126 132 122 118 118" stroke="#8B4c20" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M196 123 C212 126 226 122 240 118" stroke="#8B4c20" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M165 90 C140 75 114 68 86 58" stroke="#7a3c12" strokeWidth="6.5" fill="none" strokeLinecap="round" />
            <path d="M195 78 C220 63 248 54 278 44" stroke="#7a3c12" strokeWidth="6.5" fill="none" strokeLinecap="round" />
            <ellipse cx="72" cy="52" rx="38" ry="34" fill="url(#mtCrown3)" />
            <ellipse cx="58" cy="42" rx="26" ry="24" fill="#126000" />
            <ellipse cx="292" cy="38" rx="38" ry="34" fill="url(#mtCrown3)" />
            <ellipse cx="306" cy="28" rx="24" ry="22" fill="#126000" />
            <ellipse cx="180" cy="32" rx="72" ry="60" fill="url(#mtCrown2)" />
            <ellipse cx="150" cy="18" rx="46" ry="38" fill="url(#mtCrown3)" />
            <ellipse cx="210" cy="16" rx="44" ry="36" fill="url(#mtCrown3)" />
            <ellipse cx="180" cy="8" rx="38" ry="30" fill="#1a7208" />
            <ellipse cx="180" cy="-2" rx="26" ry="20" fill="#229010" />
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
              <rect x="160" y="106" width="5" height="15" rx="1" /><rect x="196" y="106" width="5" height="15" rx="1" />
            </g>
          </g>
        )}

        {/* Stage 10: おすそわけの木 — golden gift tree ✨ */}
        {stage >= 10 && (
          <g filter="url(#mtShadow)">
            {/* Golden aura */}
            <ellipse cx="180" cy="55" rx="110" ry="90" fill="url(#mtGlow)" />
            {/* Massive trunk */}
            <path d="M158 130 C151 100 151 70 154 44 L206 44 C209 70 209 100 202 130 Z" fill="url(#mtTrunk)" />
            {[58,74,90,108].map(y=>(
              <path key={y} d={`M162 ${y} Q180 ${y-7} 198 ${y}`} stroke="#6a3210" strokeWidth="1.8" fill="none" opacity="0.35" />
            ))}
            {/* Roots */}
            <path d="M160 122 C142 125 126 121 112 116" stroke="#8B4c20" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M200 122 C218 125 232 121 246 116" stroke="#8B4c20" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M162 126 C150 130 140 128 132 126" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M198 126 C210 130 220 128 228 126" stroke="#8B4c20" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Grand spreading branches */}
            <path d="M162 82 C136 66 108 56 78 44" stroke="#7a3c12" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M198 68 C224 52 254 42 286 32" stroke="#7a3c12" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M166 62 C152 46 144 30 140 14" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M194 54 C208 38 216 22 218 6" stroke="#7a3c12" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Far clusters */}
            <ellipse cx="62" cy="38" rx="42" ry="36" fill="url(#mtCrown3)" />
            <ellipse cx="46" cy="28" rx="28" ry="26" fill="#0e5800" />
            <ellipse cx="302" cy="26" rx="42" ry="36" fill="url(#mtCrown3)" />
            <ellipse cx="318" cy="16" rx="26" ry="24" fill="#0e5800" />
            {/* Sub-branch crowns */}
            <ellipse cx="146" cy="10" rx="30" ry="24" fill="#1a7010" />
            <ellipse cx="216" cy="4" rx="28" ry="22" fill="#1a7010" />
            {/* Enormous main crown */}
            <ellipse cx="180" cy="22" rx="82" ry="66" fill="url(#mtCrown2)" />
            <ellipse cx="148" cy="8" rx="52" ry="44" fill="url(#mtCrown3)" />
            <ellipse cx="212" cy="6" rx="50" ry="42" fill="url(#mtCrown3)" />
            <ellipse cx="180" cy="-2" rx="42" ry="34" fill="#187208" />
            {/* Fruits of all colors — abundant harvest */}
            {[{x:74,y:32,g:'mtFruitAu'},{x:58,y:42,g:'mtFruitO'},{x:90,y:22,g:'mtFruitAu'},
              {x:108,y:10,g:'mtFruitR'},{x:126,y:0,g:'mtFruitAu'},{x:144,y:-4,g:'mtFruitO'},
              {x:162,y:-6,g:'mtFruitAu'},{x:180,y:-8,g:'mtFruitR'},{x:198,y:-6,g:'mtFruitAu'},
              {x:216,y:-2,g:'mtFruitO'},{x:234,y:4,g:'mtFruitAu'},{x:252,y:14,g:'mtFruitR'},
              {x:270,y:24,g:'mtFruitAu'},{x:290,y:22,g:'mtFruitO'},{x:306,y:14,g:'mtFruitAu'},
              {x:160,y:12,g:'mtFruitR'},{x:180,y:8,g:'mtFruitAu'},{x:200,y:10,g:'mtFruitO'},
              {x:172,y:24,g:'mtFruitAu'},{x:188,y:22,g:'mtFruitR'}].map(({x,y,g},i) => (
              <Fruit key={i} x={x} y={y} r={8.5} g={g} />
            ))}
            {/* Golden sparkles */}
            {[[90,16],[140,4],[180,-12],[220,2],[278,18],[152,20],[208,16],[180,30]].map(([x,y],i) => (
              <g key={i}>
                <path d={`M${x} ${y-6} L${x} ${y+6} M${x-6} ${y} L${x+6} ${y}`} stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
                <path d={`M${x-4} ${y-4} L${x+4} ${y+4} M${x+4} ${y-4} L${x-4} ${y+4}`} stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              </g>
            ))}
            {/* Walkway + bench */}
            <rect x="118" y="127" width="124" height="8" fill="#c8a860" rx="2" opacity="0.9" />
            <g fill="#7B4E28">
              <rect x="148" y="116" width="64" height="5" rx="2" /><rect x="148" y="105" width="64" height="4" rx="2" />
              <rect x="158" y="105" width="5" height="16" rx="1" /><rect x="198" y="105" width="5" height="16" rx="1" />
            </g>
          </g>
        )}

        {/* Stage label bar */}
        <rect x="0" y="157" width="360" height="23" fill="rgba(0,0,0,0.2)" />
        <text x="180" y="173" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="'Noto Sans JP', sans-serif">
          {TOWN_STAGES[stage].icon} {TOWN_STAGES[stage].name}　｜　おすそ分け {purchaseCount}回達成
        </text>
      </g>
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function MyTown({ purchaseCount, fullPage = false }: MyTownProps) {
  const stage = getTownStage(purchaseCount);
  const stageInfo = TOWN_STAGES[stage];
  const nextStage = stage < TOWN_STAGES.length - 1 ? TOWN_STAGES[stage + 1] : null;
  const finalStage = TOWN_STAGES[MAX_STAGE];
  const isMax = stage >= MAX_STAGE;

  const progressPct = nextStage
    ? Math.min(100, ((purchaseCount - stageInfo.minCount) / (nextStage.minCount - stageInfo.minCount)) * 100)
    : 100;

  // ── Evolution popup logic ──────────────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);
  const [popupStage, setPopupStage] = useState(stage);
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
      localStorage.setItem(LS_KEY, String(stage));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const title = getTitle(stage);
  const gameFont = { fontFamily: "'Outfit', 'Noto Sans JP', sans-serif" };

  // ── Info Panel（共通）────────────────────────────────────────────────
  const infoPanel = (
    <div className={fullPage ? 'px-4 pt-4 pb-5' : 'px-4 pt-3 pb-4'}>

      {/* ヘッダー行：タイトル＋レベル＋称号 */}
      <div className="flex items-center justify-between mb-2.5 gap-3">
        <div className="flex-1 min-w-0">
          {/* 称号バッジ */}
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 mb-1 flex-wrap"
          >
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide"
              style={gameFont}>
              Lv.{stage}
            </span>
            <span className={`font-black text-primary ${fullPage ? 'text-sm' : 'text-xs'}`} style={gameFont}>
              {title}
            </span>
          </motion.div>

          <h3 className={`font-black text-foreground flex items-center gap-1.5 ${fullPage ? 'text-lg' : 'text-[15px]'}`}
            style={gameFont}>
            🏘️ マイタウン
          </h3>
          <p className={`text-muted-foreground mt-0.5 leading-snug ${fullPage ? 'text-sm' : 'text-xs'}`}>
            {stageInfo.description}
          </p>
        </div>

        {/* ステージ数字（大） */}
        <div className="text-right shrink-0">
          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">STAGE</div>
          <motion.div
            key={stage}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`font-black text-primary leading-none ${fullPage ? 'text-5xl' : 'text-4xl'}`}
            style={gameFont}
          >
            {stage}
          </motion.div>
          <div className="text-[9px] text-muted-foreground">/ {MAX_STAGE}</div>
        </div>
      </div>

      {/* プログレスバー */}
      {!isMax ? (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-muted-foreground font-medium ${fullPage ? 'text-xs' : 'text-[11px]'}`}>
                次: {nextStage!.icon} {nextStage!.name}
              </span>
              <span className={`font-black text-foreground ${fullPage ? 'text-xs' : 'text-[11px]'}`}>
                あと {nextStage!.minCount - purchaseCount}回
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex-1 relative bg-secondary rounded-full overflow-hidden ${fullPage ? 'h-4' : 'h-3'}`}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e, #16a34a)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, progressPct)}%` }}
                  transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                />
                {/* グロー光沢 */}
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none" />
              </div>
              <div className="flex flex-col items-center shrink-0 opacity-35">
                <span className="text-sm leading-none">{finalStage.icon[0]}</span>
                <span className="text-[8px] font-black text-muted-foreground whitespace-nowrap">Lv.{MAX_STAGE}</span>
              </div>
            </div>
          </div>

          {/* 次の進化メッセージ */}
          <motion.div
            className="bg-secondary/60 rounded-2xl px-3 py-2.5"
            whileTap={{ scale: 0.97 }}
          >
            <p className={`text-muted-foreground leading-snug ${fullPage ? 'text-sm' : 'text-[11px]'}`}>
              あと <span className="font-black text-foreground" style={gameFont}>{nextStage!.minCount - purchaseCount}回</span> おすそ分けすると「{nextStage!.name}」に進化！🌿
            </p>
            <p className={`text-primary font-bold mt-1 flex items-center gap-1 ${fullPage ? 'text-sm' : 'text-[11px]'}`}>
              <span>✨</span>
              <span className="text-foreground font-semibold">{nextStage!.benefit}</span>
            </p>
          </motion.div>
        </>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 text-center">
          <p className={`font-black text-emerald-700 dark:text-emerald-400 ${fullPage ? 'text-base' : 'text-sm'}`} style={gameFont}>
            🌟 最高ステージ達成！フードロス・ヒーロー
          </p>
          <p className={`text-emerald-600 dark:text-emerald-500 mt-1 ${fullPage ? 'text-sm' : 'text-xs'}`}>
            {stageInfo.benefit}
          </p>
        </div>
      )}
    </div>
  );

  // ── フルページモード ───────────────────────────────────────────────
  if (fullPage) {
    return (
      <>
        <AnimatePresence>
          {showPopup && (
            <EvolutionPopup stage={popupStage} onClose={() => setShowPopup(false)} />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col flex-1 w-full"
        >
          {/* SVG: 残り高さをすべて使用 */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <TownScene stage={stage} purchaseCount={purchaseCount} tall fillHeight />
          </div>

          {/* Info Panel */}
          <div className="bg-card border-t border-border shadow-sm shrink-0">
            {infoPanel}
          </div>
        </motion.div>
      </>
    );
  }

  // ── カードモード（既存の見た目を維持）──────────────────────────────
  return (
    <>
      <AnimatePresence>
        {showPopup && (
          <EvolutionPopup stage={popupStage} onClose={() => setShowPopup(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-4"
      >
        <TownScene stage={stage} purchaseCount={purchaseCount} />
        {infoPanel}
      </motion.div>
    </>
  );
}
