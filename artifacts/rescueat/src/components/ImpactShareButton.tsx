import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

type Props = {
  pickedUpCount: number;
  foodSavedKg: number;
  co2Saved: number;
};

const APP_URL = 'https://osusowakejapan.org/';

function buildShareText(pickedUpCount: number, foodSavedKg: number, co2Saved: number): string {
  if (pickedUpCount === 0) {
    return `「おすそわけ」 で食品ロス削減に参加してみよう🍱✨\n${APP_URL}`;
  }
  return [
    `🌱 私は「おすそわけ」 で ${pickedUpCount} 食 救済しました！`,
    `食品ロス ${foodSavedKg}kg・CO₂ ${co2Saved}kg を削減 🌍`,
    `あなたもお得に食品ロス削減しませんか？`,
    APP_URL,
  ].join('\n');
}

export function ImpactShareButton({ pickedUpCount, foodSavedKg, co2Saved }: Props) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const text = buildShareText(pickedUpCount, foodSavedKg, co2Saved);
    const navAny = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };

    if (typeof navAny.share === 'function') {
      try {
        await navAny.share({
          title: 'おすそわけ - 食品ロス削減',
          text,
          url: APP_URL,
        });
        return;
      } catch (e: unknown) {
        const name = (e as { name?: string })?.name;
        if (name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('コピーしてシェアしてください:', text);
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="w-full mt-2 flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors rounded-lg py-1.5 text-white text-[11px] font-bold backdrop-blur-sm"
      aria-label="救済記録をシェア"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          コピーしました
        </>
      ) : (
        <>
          <Share2 className="w-3 h-3" />
          SNS でシェア
        </>
      )}
    </button>
  );
}
