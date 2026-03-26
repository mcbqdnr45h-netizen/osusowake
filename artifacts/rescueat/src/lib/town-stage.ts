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
    description: 'まだ荒れた土地…最初のおすそ分けで変えよう',
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
    benefit: 'OsusOwake公式「守護者」称号が授与される！',
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
