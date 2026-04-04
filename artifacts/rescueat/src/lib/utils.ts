import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const WEEKDAY = ['日','月','火','水','木','金','土'];

/**
 * 受取時間を「日付 開始〜終了」形式にフォーマット
 * @param start    "HH:MM" | null | undefined
 * @param end      "HH:MM" | null | undefined
 * @param refDate  基準日（省略 = 今日）。ISO文字列 or Date を渡すとその日付を使用
 */
export function formatPickupTime(
  start: string | null | undefined,
  end:   string | null | undefined,
  refDate?: Date | string | null,
): string {
  if (!start && !end) return '';

  const jstOpts = { timeZone: 'Asia/Tokyo' } as const;
  const todayStr = new Date().toLocaleDateString('ja-JP', { ...jstOpts, year:'numeric', month:'2-digit', day:'2-digit' });
  const base     = refDate ? new Date(refDate) : new Date();
  const baseStr  = base.toLocaleDateString('ja-JP', { ...jstOpts, year:'numeric', month:'2-digit', day:'2-digit' });

  const time = start
    ? (end ? `${start}〜${end}` : start)
    : `〜${end}`;

  if (baseStr === todayStr) {
    return time;
  }

  const m = base.toLocaleDateString('ja-JP', { ...jstOpts, month: 'numeric' });
  const d = base.toLocaleDateString('ja-JP', { ...jstOpts, day: 'numeric' });
  const w = WEEKDAY[base.getDay()];
  return `${m}/${d}(${w}) ${time}`;
}
