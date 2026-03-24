import React from 'react';
import { motion } from 'framer-motion';
import { getTownStage, TOWN_STAGES } from '@/lib/town-stage';

interface MyTownProps {
  purchaseCount: number;
}

export function MyTown({ purchaseCount }: MyTownProps) {
  const stage = getTownStage(purchaseCount);
  const stageInfo = TOWN_STAGES[stage];
  const nextStage = TOWN_STAGES[stage + 1];

  const progressPct = nextStage
    ? Math.min(100, ((purchaseCount - stageInfo.minCount) / (nextStage.minCount - stageInfo.minCount)) * 100)
    : 100;

  const ge = (n: number) => stage >= n;

  const skyColors: [string, string][] = [
    ['#9e9892', '#d4cec4'],
    ['#b8c8d8', '#daeaf8'],
    ['#96b8d8', '#cce4f8'],
    ['#74a8cc', '#b8d8f0'],
    ['#52a0cc', '#a0d0f0'],
    ['#3a90c0', '#88c4ec'],
    ['#2878b8', '#70b0e8'],
  ];
  const groundColors = ['#7a5818', '#8a6e28', '#5a8e20', '#429018', '#308010', '#226808', '#146000'];
  const [skyTop, skyBot] = skyColors[stage];
  const groundColor = groundColors[stage];
  const groundTop = stage >= 2 ? '#6aaa28' : groundColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-4"
    >
      {/* ── SVG Town Scene ── */}
      <svg
        viewBox="0 0 360 180"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%' }}
        aria-label={`マイタウン: ${stageInfo.name}`}
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

        {/* Sky */}
        <rect x="0" y="0" width="360" height="130" fill="url(#mtSky)" />

        {/* Sun (stage 4+) */}
        {ge(4) && (
          <g>
            <circle cx="306" cy="30" r="18" fill="#FFD700" opacity="0.85" />
            <circle cx="306" cy="30" r="13" fill="#FFE84a" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
              <line
                key={a}
                x1={306 + 20 * Math.cos((a * Math.PI) / 180)}
                y1={30 + 20 * Math.sin((a * Math.PI) / 180)}
                x2={306 + 27 * Math.cos((a * Math.PI) / 180)}
                y2={30 + 27 * Math.sin((a * Math.PI) / 180)}
                stroke="#FFD700"
                strokeWidth="2"
                strokeLinecap="round"
              />
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

        {/* Birds (stage 6+) */}
        {ge(6) && (
          <g fill="none" stroke="#2a4060" strokeWidth="1.5" strokeLinecap="round">
            <path d="M38,22 Q43,17 48,22" />
            <path d="M54,16 Q59,11 64,16" />
            <path d="M172,18 Q177,13 182,18" />
            <path d="M188,26 Q193,21 198,26" />
          </g>
        )}

        {/* Background buildings (stage 6) */}
        {ge(6) && (
          <g opacity="0.55">
            <rect x="4" y="68" width="26" height="62" fill="#7090a8" rx="2" />
            <rect x="10" y="76" width="6" height="5" fill="#b0d0e8" />
            <rect x="18" y="76" width="6" height="5" fill="#b0d0e8" />
            <rect x="10" y="86" width="6" height="5" fill="#b0d0e8" />
            <rect x="18" y="86" width="6" height="5" fill="#b0d0e8" />
            <rect x="4" y="54" width="18" height="76" fill="#8096b0" rx="1" />
            <rect x="7" y="62" width="4" height="4" fill="#aac8e0" />
            <rect x="13" y="62" width="4" height="4" fill="#aac8e0" />
            <rect x="7" y="70" width="4" height="4" fill="#aac8e0" />
            <rect x="13" y="70" width="4" height="4" fill="#aac8e0" />

            <rect x="322" y="72" width="30" height="58" fill="#7090a8" rx="2" />
            <rect x="328" y="80" width="6" height="5" fill="#b0d0e8" />
            <rect x="338" y="80" width="6" height="5" fill="#b0d0e8" />
            <rect x="328" y="90" width="6" height="5" fill="#b0d0e8" />
            <rect x="338" y="90" width="6" height="5" fill="#b0d0e8" />
            <rect x="332" y="58" width="20" height="72" fill="#8096b0" rx="1" />
            <rect x="335" y="66" width="4" height="4" fill="#aac8e0" />
            <rect x="342" y="66" width="4" height="4" fill="#aac8e0" />
            <rect x="335" y="74" width="4" height="4" fill="#aac8e0" />
            <rect x="342" y="74" width="4" height="4" fill="#aac8e0" />
          </g>
        )}

        {/* Ground */}
        <rect x="0" y="130" width="360" height="50" fill="url(#mtGround)" />

        {/* Cracks (stage 0 only) */}
        {stage === 0 && (
          <g stroke="#5a3808" strokeWidth="1.5" fill="none" opacity="0.65">
            <path d="M48,134 L60,144 L54,154" />
            <path d="M148,132 L164,142 L154,152 L170,158" />
            <path d="M248,136 L260,144 L254,152" />
          </g>
        )}

        {/* Litter/debris (stage 0–1) */}
        {stage <= 1 && (
          <g opacity={stage === 0 ? 1 : 0.35}>
            <rect x="50" y="125" width="16" height="8" fill="#888" rx="2" />
            <rect x="54" y="123" width="8" height="4" fill="#aaa" rx="1" />
            <rect x="188" y="127" width="20" height="5" fill="#bc8888" rx="1" />
            <rect x="288" y="125" width="12" height="7" fill="#aaa" rx="1" />
          </g>
        )}

        {/* Sprouts (stage 1+, disappear at 3 when grass takes over) */}
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

        {/* Grass tufts (stage 2+) */}
        {ge(2) && (
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

        {/* Tree Left (stage 3+) */}
        {ge(3) && (
          <g>
            <rect x="74" y="100" width="10" height="30" fill="#8B5E30" rx="2" />
            <ellipse cx="79" cy="90" rx="22" ry="26" fill="#3a8c18" />
            <ellipse cx="69" cy="96" rx="13" ry="15" fill="#4aaa22" />
            <ellipse cx="90" cy="94" rx="12" ry="14" fill="#4aaa22" />
            <ellipse cx="79" cy="74" rx="14" ry="16" fill="#5ac030" />
          </g>
        )}

        {/* Tree Right (stage 3+) */}
        {ge(3) && (
          <g>
            <rect x="252" y="94" width="12" height="36" fill="#8B5E30" rx="2" />
            <ellipse cx="258" cy="82" rx="26" ry="30" fill="#2a7c10" />
            <ellipse cx="248" cy="90" rx="15" ry="17" fill="#3a9218" />
            <ellipse cx="270" cy="88" rx="13" ry="15" fill="#3a9218" />
            <ellipse cx="258" cy="66" rx="17" ry="17" fill="#4aae28" />
          </g>
        )}

        {/* Flowers near trees (stage 4+) */}
        {ge(4) && (
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

        {/* Walkway/path (stage 5+) */}
        {ge(5) && (
          <rect x="128" y="127" width="104" height="8" fill="#c8a860" rx="2" opacity="0.9" />
        )}

        {/* Park bench (stage 5+) */}
        {ge(5) && (
          <g fill="#7B4E28">
            <rect x="156" y="119" width="48" height="5" rx="2" />
            <rect x="156" y="110" width="48" height="4" rx="2" />
            <rect x="166" y="110" width="4" height="14" rx="1" />
            <rect x="190" y="110" width="4" height="14" rx="1" />
            <rect x="160" y="124" width="4" height="9" rx="1" />
            <rect x="196" y="124" width="4" height="9" rx="1" />
          </g>
        )}

        {/* Large center tree (stage 5+) */}
        {ge(5) && (
          <g>
            <rect x="174" y="70" width="12" height="60" fill="#6B4423" rx="2" />
            <ellipse cx="180" cy="58" rx="38" ry="42" fill="#1a6c08" />
            <ellipse cx="164" cy="68" rx="22" ry="26" fill="#268c10" />
            <ellipse cx="196" cy="66" rx="20" ry="24" fill="#268c10" />
            <ellipse cx="180" cy="40" rx="24" ry="22" fill="#30a818" />
          </g>
        )}

        {/* Stage name overlay */}
        <rect x="0" y="157" width="360" height="23" fill="rgba(0,0,0,0.18)" />
        <text
          x="180"
          y="173"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="bold"
          fontFamily="'Noto Sans JP', sans-serif"
        >
          {stageInfo.icon} {stageInfo.name}　|　おすそ分け {purchaseCount}回達成
        </text>
      </svg>

      {/* ── Info Panel ── */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-foreground text-base flex items-center gap-2">
              🏘️ マイタウン
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{stageInfo.description}</p>
          </div>
          <div className="text-right ml-3 shrink-0">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">ステージ</div>
            <div className="text-3xl font-black text-primary leading-none">{stage}</div>
            <div className="text-[10px] text-muted-foreground">/ 6</div>
          </div>
        </div>

        {nextStage ? (
          <>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">次のステージ: {nextStage.icon} {nextStage.name}</span>
              <span className="font-black text-foreground">あと {nextStage.minCount - purchaseCount}回</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(3, progressPct)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {nextStage.minCount - purchaseCount}回おすそ分けすると「{nextStage.name}」に進化！🌿
            </p>
          </>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-center">
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
              🌟 最高ステージ達成！あなたは街の守護者です
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
