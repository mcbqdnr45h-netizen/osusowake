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
  const shift = tall ? 60 : 0;   // 地面を 60単位 下げる
  const groundY = 130 + shift;   // tall=190, normal=130
  const viewH = tall ? 240 : 180;

  const skyColors: [string, string][] = [
    ['#9e9892', '#d4cec4'], // 0 荒地
    ['#b8c8d8', '#daeaf8'], // 1 新芽
    ['#96b8d8', '#cce4f8'], // 2 双葉
    ['#74a8cc', '#b8d8f0'], // 3 若葉
    ['#52a0cc', '#a0d0f0'], // 4 若木
    ['#3a90c0', '#88c4ec'], // 5 花咲く庭
    ['#2878b8', '#70b0e8'], // 6 緑の丘
    ['#1a6aae', '#58a4e4'], // 7 深い森
    ['#0e5aa0', '#4090d8'], // 8 大樹
    ['#0a4e90', '#3080cc'], // 9 豊かな森
    ['#083c78', '#2070b8'], // 10 千年の森
  ];
  const groundColors = ['#7a5818','#8a6e28','#5a8e20','#429018','#308010','#226808','#146000','#0e5400','#0a4800','#083c00','#063200'];
  const [skyTop, skyBot] = skyColors[Math.min(stage, 10)];
  const groundColor = groundColors[Math.min(stage, 10)];
  const groundTop = stage >= 2 ? '#6aaa28' : groundColor;

  return (
    <svg
      viewBox={`0 0 360 ${viewH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={fillHeight ? 'xMidYMax slice' : 'xMidYMid meet'}
      style={fillHeight
        ? { display: 'block', width: '100%', height: '100%' }
        : { display: 'block', width: '100%' }}
      aria-label={`マイタウン: ${TOWN_STAGES[stage].name}`}
    >
      <defs>
        <linearGradient id="mtSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="mtGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={groundTop} />
          <stop offset="100%" stopColor={groundColor} />
        </linearGradient>
      </defs>

      {/* tall モード: 追加の空をグラデーション上端色で埋める */}
      {shift > 0 && <rect x="0" y="0" width="360" height={shift} fill={skyTop} />}

      {/* 全シーン要素を shift 分だけ下げる */}
      <g transform={shift ? `translate(0, ${shift})` : undefined}>

      {/* Sun (stage 4+) */}
      {ge(4) && (
        <g>
          <circle cx="306" cy="30" r="18" fill="#FFD700" opacity="0.85" />
          <circle cx="306" cy="30" r="13" fill="#FFE84a" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
            <line key={a}
              x1={306 + 20 * Math.cos((a * Math.PI) / 180)} y1={30 + 20 * Math.sin((a * Math.PI) / 180)}
              x2={306 + 27 * Math.cos((a * Math.PI) / 180)} y2={30 + 27 * Math.sin((a * Math.PI) / 180)}
              stroke="#FFD700" strokeWidth="2" strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* Stars (stage 0-1) */}
      {stage <= 1 && (
        <g fill="#ffffff" opacity="0.6">
          {[[30,20],[80,12],[140,18],[200,8],[260,22],[320,15]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="1.5" />
          ))}
        </g>
      )}

      {/* Clouds (stage 3+) */}
      {ge(3) && (
        <g opacity="0.88">
          <ellipse cx="78" cy="34" rx="28" ry="13" fill="white" />
          <ellipse cx="58" cy="38" rx="18" ry="11" fill="white" />
          <ellipse cx="98" cy="37" rx="20" ry="10" fill="white" />
          <ellipse cx="258" cy="42" rx="24" ry="11" fill="white" />
          <ellipse cx="242" cy="46" rx="15" ry="9" fill="white" />
          <ellipse cx="276" cy="45" rx="17" ry="8" fill="white" />
        </g>
      )}

      {/* Birds (stage 7+) */}
      {ge(7) && (
        <g fill="none" stroke="#2a4060" strokeWidth="1.5" strokeLinecap="round">
          <path d="M38,22 Q43,17 48,22" />
          <path d="M54,16 Q59,11 64,16" />
          <path d="M172,18 Q177,13 182,18" />
          <path d="M188,26 Q193,21 198,26" />
        </g>
      )}

      {/* Background buildings (stage 9+) */}
      {ge(9) && (
        <g opacity="0.45">
          <rect x="4" y="68" width="26" height="62" fill="#7090a8" rx="2" />
          <rect x="10" y="76" width="6" height="5" fill="#b0d0e8" />
          <rect x="18" y="76" width="6" height="5" fill="#b0d0e8" />
          <rect x="4" y="54" width="18" height="76" fill="#8096b0" rx="1" />
          <rect x="322" y="72" width="30" height="58" fill="#7090a8" rx="2" />
          <rect x="328" y="80" width="6" height="5" fill="#b0d0e8" />
          <rect x="338" y="80" width="6" height="5" fill="#b0d0e8" />
          <rect x="332" y="58" width="20" height="72" fill="#8096b0" rx="1" />
        </g>
      )}

      {/* Ground */}
      <rect x="0" y="130" width="360" height="50" fill="url(#mtGround)" />

      {/* Cracks (stage 0) */}
      {stage === 0 && (
        <g stroke="#5a3808" strokeWidth="1.5" fill="none" opacity="0.65">
          <path d="M48,134 L60,144 L54,154" />
          <path d="M148,132 L164,142 L154,152 L170,158" />
          <path d="M248,136 L260,144 L254,152" />
        </g>
      )}

      {/* Litter (stage 0-1) */}
      {stage <= 1 && (
        <g opacity={stage === 0 ? 1 : 0.35}>
          <rect x="50" y="125" width="16" height="8" fill="#888" rx="2" />
          <rect x="54" y="123" width="8" height="4" fill="#aaa" rx="1" />
          <rect x="188" y="127" width="20" height="5" fill="#bc8888" rx="1" />
          <rect x="288" y="125" width="12" height="7" fill="#aaa" rx="1" />
        </g>
      )}

      {/* Sprouts (stage 1-2) */}
      {ge(1) && stage < 3 && (
        <g>
          {[{ x: 118, y: 126 }, { x: 200, y: 124 }, { x: 290, y: 126 }].map(({ x, y }, i) => (
            <g key={i}>
              <line x1={x + 4} y1={y + 8} x2={x + 4} y2={y + 2} stroke="#5a8030" strokeWidth="1.5" />
              <ellipse cx={x + 4} cy={y} rx="5" ry="4" fill="#6abe30" />
              <ellipse cx={x + 1} cy={y + 4} rx="3.5" ry="2.5" fill="#7ad040" transform={`rotate(-30,${x + 1},${y + 4})`} />
              <ellipse cx={x + 7} cy={y + 4} rx="3.5" ry="2.5" fill="#7ad040" transform={`rotate(30,${x + 7},${y + 4})`} />
            </g>
          ))}
        </g>
      )}

      {/* Dual leaf sprouts (stage 2) */}
      {stage === 2 && (
        <g>
          {[60, 150, 240, 310].map((x, i) => (
            <g key={i}>
              <line x1={x} y1={130} x2={x} y2={118} stroke="#4a7c20" strokeWidth="2" />
              <ellipse cx={x - 6} cy={120} rx="7" ry="4" fill="#5ab028" transform={`rotate(-35,${x - 6},120)`} />
              <ellipse cx={x + 6} cy={120} rx="7" ry="4" fill="#5ab028" transform={`rotate(35,${x + 6},120)`} />
            </g>
          ))}
        </g>
      )}

      {/* Grass tufts (stage 3+) */}
      {ge(3) && (
        <g fill="#4a9820">
          {[18, 44, 92, 132, 156, 198, 224, 268, 298, 332].map(x => (
            <g key={x}>
              <polygon points={`${x},130 ${x + 3},118 ${x + 6},130`} />
              <polygon points={`${x + 5},130 ${x + 8},120 ${x + 11},130`} />
              <polygon points={`${x + 9},130 ${x + 12},115 ${x + 15},130`} />
            </g>
          ))}
        </g>
      )}

      {/* Side trees L (stage 4+) */}
      {ge(4) && (
        <g>
          <rect x="74" y="100" width="10" height="30" fill="#8B5E30" rx="2" />
          <ellipse cx="79" cy="90" rx="22" ry="26" fill="#3a8c18" />
          <ellipse cx="69" cy="96" rx="13" ry="15" fill="#4aaa22" />
          <ellipse cx="90" cy="94" rx="12" ry="14" fill="#4aaa22" />
          <ellipse cx="79" cy="74" rx="14" ry="16" fill="#5ac030" />
        </g>
      )}

      {/* Side trees R (stage 4+) */}
      {ge(4) && (
        <g>
          <rect x="252" y="94" width="12" height="36" fill="#8B5E30" rx="2" />
          <ellipse cx="258" cy="82" rx="26" ry="30" fill="#2a7c10" />
          <ellipse cx="248" cy="90" rx="15" ry="17" fill="#3a9218" />
          <ellipse cx="270" cy="88" rx="13" ry="15" fill="#3a9218" />
          <ellipse cx="258" cy="66" rx="17" ry="17" fill="#4aae28" />
        </g>
      )}

      {/* Flowers (stage 5+) */}
      {ge(5) && (
        <g>
          {[
            { x: 52, c: '#ff6090' }, { x: 63, c: '#ff90c0' }, { x: 103, c: '#ffcc00' }, { x: 113, c: '#ff9900' },
            { x: 226, c: '#ff6090' }, { x: 237, c: '#cc44ff' }, { x: 283, c: '#ffcc00' }, { x: 294, c: '#ff6090' },
          ].map(({ x, c }, i) => (
            <g key={i}>
              <circle cx={x} cy={128} r="4" fill={c} />
              <circle cx={x} cy={128} r="2" fill="#ffee88" />
            </g>
          ))}
        </g>
      )}

      {/* Walkway (stage 7+) */}
      {ge(7) && <rect x="128" y="127" width="104" height="8" fill="#c8a860" rx="2" opacity="0.9" />}

      {/* Bench (stage 7+) */}
      {ge(7) && (
        <g fill="#7B4E28">
          <rect x="156" y="119" width="48" height="5" rx="2" />
          <rect x="156" y="110" width="48" height="4" rx="2" />
          <rect x="166" y="110" width="4" height="14" rx="1" />
          <rect x="190" y="110" width="4" height="14" rx="1" />
          <rect x="160" y="124" width="4" height="9" rx="1" />
          <rect x="196" y="124" width="4" height="9" rx="1" />
        </g>
      )}

      {/* Large center tree (stage 6+) */}
      {ge(6) && (
        <g>
          <rect x="174" y="70" width="12" height="60" fill="#6B4423" rx="2" />
          <ellipse cx="180" cy="58" rx="38" ry="42" fill="#1a6c08" />
          <ellipse cx="164" cy="68" rx="22" ry="26" fill="#268c10" />
          <ellipse cx="196" cy="66" rx="20" ry="24" fill="#268c10" />
          <ellipse cx="180" cy="40" rx="24" ry="22" fill="#30a818" />
        </g>
      )}

      {/* Extra deep-forest trees (stage 8+) */}
      {ge(8) && (
        <g>
          <rect x="28" y="80" width="8" height="50" fill="#5a3c18" rx="1" />
          <ellipse cx="32" cy="72" rx="18" ry="20" fill="#145000" />
          <ellipse cx="32" cy="60" rx="12" ry="13" fill="#1c6808" />
          <rect x="314" y="76" width="9" height="54" fill="#5a3c18" rx="1" />
          <ellipse cx="318" cy="68" rx="19" ry="21" fill="#145000" />
          <ellipse cx="318" cy="56" rx="13" ry="14" fill="#1c6808" />
        </g>
      )}

      {/* Thousand-year forest extras (stage 10) */}
      {ge(10) && (
        <g>
          <rect x="100" y="60" width="10" height="70" fill="#4a2c10" rx="2" />
          <ellipse cx="105" cy="48" rx="26" ry="28" fill="#0a4000" />
          <ellipse cx="105" cy="34" rx="18" ry="18" fill="#0e5008" />
          <rect x="238" y="56" width="11" height="74" fill="#4a2c10" rx="2" />
          <ellipse cx="243" cy="44" rx="28" ry="30" fill="#0a4000" />
          <ellipse cx="243" cy="30" rx="19" ry="19" fill="#0e5008" />
        </g>
      )}

      {/* Stage label bar */}
      <rect x="0" y="157" width="360" height="23" fill="rgba(0,0,0,0.18)" />
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
