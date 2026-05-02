export type StockUrgency = {
  level: 'sold-out' | 'critical' | 'low' | 'ample';
  label: string;
  shortLabel: string;
  pulse: boolean;
  toneClass: string;
  pillClass: string;
  dotClass: string;
  showAnimation: boolean;
};

export function getStockUrgency(count: number): StockUrgency {
  if (count <= 0) {
    return {
      level: 'sold-out',
      label: '完売しました',
      shortLabel: '完売',
      pulse: false,
      toneClass: 'text-muted-foreground',
      pillClass: 'bg-muted text-muted-foreground border-transparent',
      dotClass: 'bg-muted-foreground/40',
      showAnimation: false,
    };
  }
  if (count <= 3) {
    return {
      level: 'critical',
      label: `残りわずか ${count}個`,
      shortLabel: `残り${count}個`,
      pulse: true,
      toneClass: 'text-[#B5390B] dark:text-red-400',
      pillClass:
        'bg-gradient-to-br from-rose-50 to-rose-100/70 text-[#7B1F2A] border-rose-200 dark:from-red-950/50 dark:to-red-900/30 dark:text-red-300 dark:border-red-900/50',
      dotClass: 'bg-[#B5390B] dark:bg-red-400',
      showAnimation: true,
    };
  }
  if (count <= 5) {
    return {
      level: 'low',
      label: `あと ${count}個`,
      shortLabel: `残り${count}個`,
      pulse: true,
      toneClass: 'text-[#7C4A1E] dark:text-amber-300',
      pillClass:
        'bg-gradient-to-br from-amber-50 to-orange-100/70 text-[#7C4A1E] border-amber-200 dark:from-orange-950/50 dark:to-amber-900/30 dark:text-orange-300 dark:border-amber-900/50',
      dotClass: 'bg-amber-500 dark:bg-amber-400',
      showAnimation: false,
    };
  }
  return {
    level: 'ample',
    label: `在庫あり ${count}個`,
    shortLabel: `${count}個`,
    pulse: false,
    toneClass: 'text-[#3D5A47] dark:text-emerald-400',
    pillClass:
      'bg-gradient-to-br from-emerald-50 to-green-100/70 text-[#3D5A47] border-emerald-200 dark:from-emerald-950/50 dark:to-green-900/30 dark:text-emerald-400 dark:border-emerald-900/50',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    showAnimation: false,
  };
}

export function calculateFeeBreakdown(basePrice: number, quantity = 1) {
  const subtotal = basePrice * quantity;
  const rawFee = subtotal * 0.05;
  const fee = Math.round(rawFee / 10) * 10;
  const total = subtotal + fee;
  return { subtotal, fee, total };
}
