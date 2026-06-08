import React from 'react';
import logoUrl from '@/lib/logo';
import { Apple, Smartphone, ArrowRight } from 'lucide-react';

// アプリ取得の振り分けページ (友だち共有リンクの飛び先)。
// 端末を判定して iPhone→App Store / Android→Play / それ以外→Web に誘導する。
const APP_STORE_URL = 'https://apps.apple.com/jp/app/id6763268307';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.yuhi.osusowake';
const WEB_URL = 'https://osusowakejapan.org';
// ネイティブスキーム: タップで App Store / Play アプリを直接開く。
// (https だと LINE 等のアプリ内ブラウザで Web ページが開くだけになる)
const APP_STORE_APP = 'itms-apps://apps.apple.com/jp/app/id6763268307';
const PLAY_STORE_APP = 'market://details?id=com.yuhi.osusowake';

// ★ Android 版を Google Play で公開したら true に変更する。
const ANDROID_PUBLISHED = false;

type OS = 'ios' | 'android' | 'other';
function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export default function GetApp() {
  const os = detectOS();
  const isIos = os === 'ios';
  const playReady = os === 'android' && ANDROID_PUBLISHED;
  const storeDevice = isIos || playReady;

  // ベストエフォートの自動リダイレクト (Safari 等では効く。アプリ内ブラウザは
  // タップ無しのスキーム遷移をブロックするため、下の大ボタンが確実な導線)。
  React.useEffect(() => {
    if (isIos) window.location.href = APP_STORE_APP;
    else if (playReady) window.location.href = PLAY_STORE_APP;
  }, [isIos, playReady]);

  const cta = isIos
    ? { href: APP_STORE_APP, label: 'App Store でインストール', icon: Apple }
    : playReady
      ? { href: PLAY_STORE_APP, label: 'Google Play でインストール', icon: Smartphone }
      : { href: WEB_URL, label: 'ブラウザで今すぐ使う', icon: ArrowRight };
  const CtaIcon = cta.icon;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-br from-orange-50 via-background to-rose-50 text-center">
      <img
        src={logoUrl}
        alt="おすそわけ"
        className="w-24 h-24 rounded-3xl object-cover shadow-lg ring-1 ring-black/5 mb-5"
      />
      <h1 className="text-2xl font-black text-foreground mb-2">おすそわけ</h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-8">
        ご近所のお店から、閉店前の余剰食品を
        <br />
        おトクにゲット🍞 フードロスを減らそう。
      </p>

      <a
        href={cta.href}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-base py-4 rounded-2xl shadow-md active:scale-[0.98] transition-transform"
      >
        <CtaIcon className="w-5 h-5" />
        {cta.label}
      </a>

      {/* iOS: スキームが開かない環境向けに https の保険リンク */}
      {isIos && (
        <a
          href={APP_STORE_URL}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
        >
          開かない場合はこちら（App Store）
        </a>
      )}

      {/* どの端末でも Web で使える導線 */}
      <a
        href={WEB_URL}
        className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
      >
        またはブラウザでそのまま使う →
      </a>

      {os === 'android' && !ANDROID_PUBLISHED && (
        <p className="mt-8 text-xs text-muted-foreground/70">
          Android アプリは近日公開予定。今はブラウザでご利用いただけます
        </p>
      )}
      {!storeDevice && os === 'ios' && (
        <p className="mt-8 text-xs text-muted-foreground/70">Android 版は近日公開予定です</p>
      )}
    </div>
  );
}
