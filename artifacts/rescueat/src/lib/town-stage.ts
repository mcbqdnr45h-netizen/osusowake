export interface TownStageConfig {
  stage: number;
  minCount: number;
  name: string;
  description: string;
  icon: string;
  benefit: string;
}

export const TOWN_STAGES: TownStageConfig[] = [
  {
    stage: 0,
    minCount: 0,
    name: '荒地',
    description: 'まだ荒れた土地…最初のおすそわけで変えよう',
    icon: '🏚️',
    benefit: '最初の1回で「新芽」に進化！',
  },
  {
    stage: 1,
    minCount: 1,
    name: '新芽',
    description: '最初の小さな芽が地面から顔を出しました',
    icon: '🌱',
    benefit: 'マイタウンにオリジナルの看板が登場！',
  },
  {
    stage: 2,
    minCount: 3,
    name: '双葉',
    description: '2枚の葉が開き、生命の息吹を感じます',
    icon: '🌿',
    benefit: 'マイタウンに豪雨がなくなる（晴天率UP）',
  },
  {
    stage: 3,
    minCount: 7,
    name: '若葉',
    description: '柔らかな緑の葉が広がりはじめました',
    icon: '🍃',
    benefit: '購入履歴の詳細フィルター機能が解放される！',
  },
  {
    stage: 4,
    minCount: 15,
    name: '若木',
    description: '細い幹が根を張り、空へと伸び始めています',
    icon: '🌲',
    benefit: 'お気に入り店舗の新着を最優先で表示！',
  },
  {
    stage: 5,
    minCount: 25,
    name: '花咲く庭',
    description: '色とりどりの花が咲き誇る、賑やかな庭になりました',
    icon: '🌸',
    benefit: 'シークレットクーポンの先行受信権GET！',
  },
  {
    stage: 6,
    minCount: 40,
    name: '緑の丘',
    description: '小高い丘一面が緑に覆われ、風が気持ちよい',
    icon: '🏔️',
    benefit: '新機能を一足先に体験できる先行アクセス！',
  },
  {
    stage: 7,
    minCount: 60,
    name: '深い森',
    description: '木々が生い茂り、森の生き物たちが集まってきた',
    icon: '🌳',
    benefit: '月次フードロス削減レポートが届く！',
  },
  {
    stage: 8,
    minCount: 90,
    name: '大樹',
    description: '大地にどっしりと根を張る、堂々たる大樹が誕生',
    icon: '🌲✨',
    benefit: '特別バッジ解除＆VIP優先サポート！',
  },
  {
    stage: 9,
    minCount: 130,
    name: '豊かな森',
    description: '命が溢れる豊かな森。多くの生き物が息づいています',
    icon: '🏆',
    benefit: 'おすそわけ公式「守護者」称号が授与される！',
  },
  {
    stage: 10,
    minCount: 180,
    name: '千年の森',
    description: '永遠に続く千年の森。あなたは伝説の救世主です',
    icon: '🌳🌳',
    benefit: '永久殿堂入り 🏆 全機能フルアクセス！',
  },
];

export const MAX_STAGE = TOWN_STAGES.length - 1;

export function getTownStage(purchaseCount: number): number {
  let stage = 0;
  for (let i = 0; i < TOWN_STAGES.length; i++) {
    if (purchaseCount >= TOWN_STAGES[i].minCount) stage = i;
  }
  return stage;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MyTown LEVEL SYSTEM (Lv.1 〜 Lv.999)
// ══════════════════════════════════════════════════════════════════════════════
//  視覚進化 (Stage 0-10 = 荒地→千年の森) とは別軸の数値進行システム。
//  目的: ユーザの興味本意最高到達点を Lv.999 に設定し、
//        Stage MAX 到達後も「Lv.999 を目指す」 という長期モチベーションを与える。
//
//  進行カーブ (curiosity-driven):
//   Lv 1-50  : 1 購入/Lv  (即時報酬で着火)              → Lv 50 累計 49 購入
//   Lv 51-100: 2 購入/Lv  (中盤の習慣化)               → Lv 100 累計 149 購入
//   Lv 101-200: 3 購入/Lv (継続報酬)                   → Lv 200 累計 449 購入
//   Lv 201-400: 5 購入/Lv (中堅ユーザ)                 → Lv 400 累計 1,449 購入
//   Lv 401-700: 8 購入/Lv (上級者)                     → Lv 700 累計 3,849 購入
//   Lv 701-999: 12 購入/Lv (伝説級)                    → Lv 999 累計 7,437 購入
//
//  既存 Stage 0-10 は完全保持 (移行リスクゼロ)。 Stage MAX (180 購入) 時は約 Lv 110。
// ──────────────────────────────────────────────────────────────────────────────
export const MAX_LEVEL = 999;

/** 累計購入数 → 現在の MyTown レベル (1〜999) を返す (逆関数)。 */
export function getMyTownLevel(p: number): number {
  if (p <= 0) return 1;
  if (p <= 49)   return 1 + p;
  if (p <= 149)  return 50  + Math.floor((p - 49)   / 2);
  if (p <= 449)  return 100 + Math.floor((p - 149)  / 3);
  if (p <= 1449) return 200 + Math.floor((p - 449)  / 5);
  if (p <= 3849) return 400 + Math.floor((p - 1449) / 8);
  if (p <= 7437) return 700 + Math.floor((p - 3849) / 12);
  return MAX_LEVEL;
}

/** 指定レベル到達に必要な累計購入数 (順関数)。 Lv.X+1 までの目標表示に使用。 */
export function getPurchasesForLevel(level: number): number {
  if (level <= 1)   return 0;
  if (level <= 50)  return level - 1;
  if (level <= 100) return 49   + (level - 50)  * 2;
  if (level <= 200) return 149  + (level - 100) * 3;
  if (level <= 400) return 449  + (level - 200) * 5;
  if (level <= 700) return 1449 + (level - 400) * 8;
  if (level <= 999) return 3849 + (level - 700) * 12;
  return 7437;
}

/** 次のレベルまで残り何回かを返す。 既に Lv.999 の場合は 0。 */
export function getPurchasesUntilNextLevel(purchaseCount: number): number {
  const lv = getMyTownLevel(purchaseCount);
  if (lv >= MAX_LEVEL) return 0;
  return Math.max(0, getPurchasesForLevel(lv + 1) - purchaseCount);
}

/** 現在レベルの開始位置から次レベル開始までの進捗 (0-100%)。 進捗バー描画用。 */
export function getLevelProgressPct(purchaseCount: number): number {
  const lv = getMyTownLevel(purchaseCount);
  if (lv >= MAX_LEVEL) return 100;
  const curStart  = getPurchasesForLevel(lv);
  const nextStart = getPurchasesForLevel(lv + 1);
  if (nextStart <= curStart) return 100;
  return Math.min(100, Math.max(0, ((purchaseCount - curStart) / (nextStart - curStart)) * 100));
}
