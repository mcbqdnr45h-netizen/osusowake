import React from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import {
  ChevronLeft, BookOpen, Search, Heart, ShoppingBag, CreditCard, MapPin,
  Store, Camera, Tag, Banknote, BarChart2, Bell, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ShareAppCard } from '@/components/ShareAppCard';

interface Step {
  icon: React.ReactNode;
  color: string;
  title: string;
  body: string;
}

const USER_STEPS: Step[] = [
  {
    icon: <Search className="w-5 h-5" />,
    color: 'bg-sky-100 text-sky-700',
    title: '① 近くの「おすそわけ」を探す',
    body: 'ホームのマップまたはバッグ一覧から、現在地に近いお店を探します。徒歩時間と受取可能時間が一目でわかります。',
  },
  {
    icon: <Heart className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-600',
    title: '② 気になるお店をお気に入り登録',
    body: 'ハートマークをタップするとお気に入りに保存。新しい「おすそわけ」が出品されると通知でお知らせします。',
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    title: '③ バッグを選んで予約',
    body: '気になるバッグを選び「予約する」をタップ。中身は当日のお楽しみのことが多く、通常の半額〜1/3程度でゲットできます。',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    color: 'bg-emerald-100 text-emerald-700',
    title: '④ アプリ内でお支払い',
    body: 'クレジットカード決済で完結。お店での現金やりとりは不要です。決済後すぐに6桁の受取コードが発行されます。',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    color: 'bg-orange-100 text-primary',
    title: '⑤ 受取時間内にお店へ',
    body: '指定の受取時間内にお店へ行き、6桁コードをスタッフに見せるだけ。後はバッグを受け取って完了です！',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    title: '⑥ レビューで応援',
    body: '受取後はぜひレビューを。お店の励みになり、地域全体の食品ロス削減につながります🌱',
  },
];

const STORE_STEPS: Step[] = [
  {
    icon: <Store className="w-5 h-5" />,
    color: 'bg-orange-100 text-primary',
    title: '① 店舗情報を登録して申請',
    body: '店舗名・住所・カテゴリ・営業時間を入力して申請。運営による審査（通常1〜2営業日）を経て承認されます。月額・初期費用は¥0です。',
  },
  {
    icon: <Banknote className="w-5 h-5" />,
    color: 'bg-emerald-100 text-emerald-700',
    title: '② 振込先口座を登録',
    body: 'Stripeを通じて振込先銀行口座を登録。売上は所定スケジュールでご指定の口座に自動振込されます。',
  },
  {
    icon: <Camera className="w-5 h-5" />,
    color: 'bg-violet-100 text-violet-700',
    title: '③ 「おすそわけ」を出品',
    body: '当日の売れ残りそうな商品を「おすそわけバッグ」として出品。写真・通常価格・割引価格・受取時間を設定するだけ。',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    color: 'bg-amber-100 text-amber-700',
    title: '④ 予約が入ると通知',
    body: 'お客様が予約・決済を完了するとプッシュ通知でお知らせ。予約一覧から準備するバッグの数を確認できます。',
  },
  {
    icon: <Tag className="w-5 h-5" />,
    color: 'bg-sky-100 text-sky-700',
    title: '⑤ 受取コードを確認して渡すだけ',
    body: 'お客様が来店したら、6桁の受取コードを確認するだけ。バッグをお渡しすれば取引完了です。現金やりとりは不要。',
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    color: 'bg-rose-100 text-rose-600',
    title: '⑥ 売上はアプリ内で確認',
    body: '「売上管理」画面から月別・取引別の売上をいつでも確認可能。会計処理にも便利です。',
  },
];

const USER_TIPS = [
  '通知をONにすると、お気に入り店舗の出品をいち早くキャッチできます',
  '受取時間に間に合わない場合は早めにお店へ直接ご連絡を',
  'カート予約は10分間有効。時間内に決済を完了してください',
];

const STORE_TIPS = [
  '出品は閉店2〜3時間前がおすすめ。お客様が立ち寄りやすい時間帯になります',
  '写真と簡単な説明を添えると予約率が大幅に上がります',
  '受取時間は店舗の閉店時間と被らないように30分程度の余裕を',
];

function StepCard({ step }: { step: Step }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${step.color}`}>
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-foreground text-sm leading-snug">{step.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{step.body}</p>
      </div>
    </div>
  );
}

export default function UsageGuide() {
  const { profile } = useAuth();
  const urlMode = new URLSearchParams(window.location.search).get('mode');
  const isStoreMode = urlMode === 'store' || profile?.role === 'store_owner';

  const steps = isStoreMode ? STORE_STEPS : USER_STEPS;
  const tips = isStoreMode ? STORE_TIPS : USER_TIPS;

  return (
    <Layout showBottomNav>
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 pb-28">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1 tap-opacity"
          aria-label="前の画面に戻る"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">使い方ガイド</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isStoreMode ? 'お店の方向け：出品から売上確認まで' : '初めての方へ：予約から受取までの流れ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
            isStoreMode ? 'bg-primary/10 text-primary' : 'bg-sky-100 text-sky-700'
          }`}>
            {isStoreMode ? '🏪 店舗オーナー編' : '👤 ユーザー編'}
          </div>
          {isStoreMode && (
            <Link
              href="/usage-guide?mode=user"
              className="text-[11px] font-bold text-muted-foreground hover:text-primary underline underline-offset-2"
            >
              ユーザー編を見る →
            </Link>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((s, i) => <StepCard key={i} step={s} />)}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="font-black text-sm text-foreground">使いこなしのコツ</p>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <span className="text-emerald-600 font-black mt-0.5">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <ShareAppCard variant={isStoreMode ? 'store' : 'user'} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            さらに詳しい質問は FAQ をご覧ください
          </p>
          <Link
            href={isStoreMode ? '/help?mode=store' : '/help'}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            よくあるご質問を見る →
          </Link>
        </div>
      </div>
    </Layout>
  );
}
