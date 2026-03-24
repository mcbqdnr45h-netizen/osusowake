export interface TownStageConfig {
  stage: number;
  minCount: number;
  name: string;
  description: string;
  icon: string;
}

export const TOWN_STAGES: TownStageConfig[] = [
  {
    stage: 0,
    minCount: 0,
    name: '荒地',
    description: 'まだ荒れた土地…最初のおすそ分けで変えよう',
    icon: '🏚️',
  },
  {
    stage: 1,
    minCount: 1,
    name: '芽吹き',
    description: '最初の小さな芽が顔を出しました',
    icon: '🌱',
  },
  {
    stage: 2,
    minCount: 3,
    name: '草原',
    description: '緑の草が広がりはじめ、希望が芽生えてきた',
    icon: '🌾',
  },
  {
    stage: 3,
    minCount: 10,
    name: '若木の丘',
    description: '小さな木が育ち、丘が緑で染まってきました',
    icon: '🌿',
  },
  {
    stage: 4,
    minCount: 20,
    name: '花咲く庭',
    description: '色とりどりの花が咲き、明るい街になりました',
    icon: '🌸',
  },
  {
    stage: 5,
    minCount: 40,
    name: '緑の公園',
    description: 'ベンチと大きな木がある素敵な公園が完成！',
    icon: '🌳',
  },
  {
    stage: 6,
    minCount: 70,
    name: '理想の街',
    description: '豊かな緑と調和した美しい理想郷が完成しました',
    icon: '🏙️',
  },
];

export function getTownStage(purchaseCount: number): number {
  let stage = 0;
  for (let i = 0; i < TOWN_STAGES.length; i++) {
    if (purchaseCount >= TOWN_STAGES[i].minCount) stage = i;
  }
  return stage;
}
