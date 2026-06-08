import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

type Props = {
  pickedUpCount: number;
  foodSavedKg: number;
  co2Saved: number;
};

// 成果シェアも端末判定の取得ページへ (iPhone→App Store / Android→Play / PC→Web)。
const APP_URL = 'https://osusowakejapan.org/get';

// ★ URL を含めない本文 (Web Share API 用)
//   text + url を両方渡すと iOS Safari など多くの実装が末尾に url を自動追加し、
//   text 内に URL を入れると URL が 2 回出てしまう。 そのため text には URL を含めず
//   url パラメータでのみ渡す設計に統一する。
function buildShareBody(pickedUpCount: number, foodSavedKg: number, co2Saved: number): string {
  if (pickedUpCount === 0) {
    return `「おすそわけ」 で食品ロス削減に参加してみよう🍱✨`;
  }
  return [
    `🌱 私は「おすそわけ」 で ${pickedUpCount} 食 救済しました！`,
    `食品ロス ${foodSavedKg}kg・CO₂ ${co2Saved}kg を削減 🌍`,
    `あなたもお得に食品ロス削減しませんか？`,
  ].join('\n');
}

export function ImpactShareButton({ pickedUpCount, foodSavedKg, co2Saved }: Props) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const body = buildShareBody(pickedUpCount, foodSavedKg, co2Saved);
    // クリップボード/プロンプト用は本文末尾に URL を結合
    const fullText = `${body}\n${APP_URL}`;
    const navAny = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };

    if (typeof navAny.share === 'function') {
      try {
        await navAny.share({
          title: 'おすそわけ - 食品ロス削減',
          text: body,
          url: APP_URL,
        });
        return;
      } catch (e: unknown) {
        const name = (e as { name?: string })?.name;
        if (name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('コピーしてシェアしてください:', fullText);
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
