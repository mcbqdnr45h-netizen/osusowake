export type EcoRank = 1 | 2 | 3;

export interface EcoRankConfig {
  rank: EcoRank;
  icon: string;
  label: string;
  sublabel: string;
  // Tailwind classes
  sectionBg: string;
  sectionBorder: string;
  valueBg: string;
  valueText: string;
  labelText: string;
  badgeBg: string;
  badgeText: string;
  progressColor: string;
  nextThreshold: number | null;
}

const USER_THRESHOLDS = { L2: 10, L3: 50 };
const STORE_THRESHOLDS = { L2: 100, L3: 500 };

export function getUserEcoRank(co2kg: number): EcoRankConfig {
  const rank: EcoRank =
    co2kg >= USER_THRESHOLDS.L3 ? 3 :
    co2kg >= USER_THRESHOLDS.L2 ? 2 : 1;
  return buildConfig(rank, co2kg, USER_THRESHOLDS.L2, USER_THRESHOLDS.L3);
}

export function getStoreEcoRank(co2kg: number): EcoRankConfig {
  const rank: EcoRank =
    co2kg >= STORE_THRESHOLDS.L3 ? 3 :
    co2kg >= STORE_THRESHOLDS.L2 ? 2 : 1;
  return buildConfig(rank, co2kg, STORE_THRESHOLDS.L2, STORE_THRESHOLDS.L3);
}

function buildConfig(
  rank: EcoRank,
  current: number,
  l2: number,
  l3: number,
): EcoRankConfig {
  const configs: Record<EcoRank, Omit<EcoRankConfig, 'rank' | 'nextThreshold'>> = {
    1: {
      icon: '🌱',
      label: 'かけだしエコ',
      sublabel: `あと${(l2 - current).toFixed(1)}kgで「頼れるエコ」へ`,
      sectionBg: 'bg-green-50 dark:bg-green-950/30',
      sectionBorder: 'border-green-200 dark:border-green-800',
      valueBg: 'bg-green-100 dark:bg-green-900/50',
      valueText: 'text-green-700 dark:text-green-300',
      labelText: 'text-green-600 dark:text-green-400',
      badgeBg: 'bg-green-100 dark:bg-green-900/60',
      badgeText: 'text-green-700 dark:text-green-300',
      progressColor: 'bg-green-400',
    },
    2: {
      icon: '🌲',
      label: '頼れるエコ',
      sublabel: `あと${(l3 - current).toFixed(1)}kgで「伝説のエコヒーロー」へ`,
      sectionBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      sectionBorder: 'border-emerald-400 dark:border-emerald-600',
      valueBg: 'bg-emerald-200 dark:bg-emerald-800/60',
      valueText: 'text-emerald-800 dark:text-emerald-200',
      labelText: 'text-emerald-700 dark:text-emerald-300',
      badgeBg: 'bg-emerald-200 dark:bg-emerald-800/80',
      badgeText: 'text-emerald-800 dark:text-emerald-200',
      progressColor: 'bg-emerald-500',
    },
    3: {
      icon: '🌳',
      label: '伝説のエコヒーロー',
      sublabel: '最高ランク達成！地球に感謝されています',
      sectionBg: 'bg-green-900 dark:bg-green-950',
      sectionBorder: 'border-green-700 dark:border-green-600',
      valueBg: 'bg-green-800 dark:bg-green-800',
      valueText: 'text-green-100',
      labelText: 'text-green-300',
      badgeBg: 'bg-green-700',
      badgeText: 'text-green-100',
      progressColor: 'bg-green-400',
    },
  };

  const nextThreshold =
    rank === 1 ? l2 :
    rank === 2 ? l3 : null;

  return { rank, nextThreshold, ...configs[rank] };
}

export function getEcoProgress(co2kg: number, config: EcoRankConfig, l2: number, l3: number): number {
  if (config.rank === 3) return 100;
  if (config.rank === 2) return Math.min(100, ((co2kg - l2) / (l3 - l2)) * 100);
  return Math.min(100, (co2kg / l2) * 100);
}

export function getUserProgress(co2kg: number, config: EcoRankConfig): number {
  return getEcoProgress(co2kg, config, 10, 50);
}

export function getStoreProgress(co2kg: number, config: EcoRankConfig): number {
  return getEcoProgress(co2kg, config, 100, 500);
}
