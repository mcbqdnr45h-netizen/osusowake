import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  ChevronDown, ChevronUp, ChevronLeft, HelpCircle,
  ShoppingBag, CreditCard, AlertTriangle, MessageCircle,
  Store, Banknote, Receipt, BadgePercent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: FaqItem[];
}

/* ─────────────────────────────────────────────
   ユーザー（購入者）向け FAQ
───────────────────────────────────────────── */
const USER_FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'order',
    title: '注文・受取について',
    icon: <ShoppingBag className="w-5 h-5" />,
    color: 'bg-orange-100 text-primary',
    items: [
      {
        q: '商品の内容は事前にわかりますか？',
        a: '商品の種類によって異なります。\n\n・おすそわけ袋：中身はお楽しみのセット形式のため、具体的な中身は事前にお知らせできません。\n\n・単品商品：商品名に記載されている特定の商品を販売しています。\n\nいずれの場合も、アレルギーなどが心配な方は受取時に店舗スタッフへ直接ご確認ください。',
      },
      {
        q: '受取方法を教えてください。',
        a: '購入後に発行される「電子チケット（QRコード）」を店舗スタッフに提示してください。アプリ内「購入履歴」→該当の注文→「チケットを表示」からいつでか確認できます。',
      },
      {
        q: '受取時間に間に合わない場合はどうすればいいですか？',
        a: '受取可能時間はお店ごとに異なります。時間に間に合わない場合は、できるだけ早めに店舗へ直接ご連絡ください。時間を過ぎた場合の商品保持はお店の判断によります。',
      },
      {
        q: '注文後のキャンセルはできますか？',
        a: '購入確定後のキャンセルは原則お受けできません。食品ロス削減のためにご協力をお願いしております。やむを得ない事情がある場合は、下記のLINEサポートまでお問い合わせください。',
      },
      {
        q: 'QRコード（電子チケット）を紛失した場合は？',
        a: 'アプリにログインして「購入履歴」から再表示できます。チケットはアプリ内にいつでも保存されていますのでご安心ください。',
      },
      {
        q: '同じ店舗でまとめて複数個購入できますか？',
        a: '1回の注文につき1つのおすそわけ袋を購入いただけます。複数購入を希望の場合は、お店に在庫が残っていれば繰り返しご購入いただけます。',
      },
    ],
  },
  {
    id: 'payment',
    title: '支払いについて',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-600',
    items: [
      {
        q: '使用できる支払い方法は何ですか？',
        a: 'クレジットカード・デビットカード（Visa / Mastercard / American Express / JCB）に対応しています。カード情報は国際基準のセキュリティ認証（PCI DSS準拠）で安全に管理されます。',
      },
      {
        q: '支払い後のキャンセル・返金はできますか？',
        a: '食品の特性上、原則として返金はお受けできません。ただし、商品未提供・二重決済など明らかなシステムトラブルの場合はご対応いたします。下記LINEサポートまでご連絡ください。',
      },
      {
        q: '領収書は発行できますか？',
        a: '発行できます。メール送付はなく、アプリ内の「購入履歴」から各自で発行する方式です。\n\n【発行手順】\n① マイページ → 「購入履歴」をタップ\n② 領収書を発行したい注文をタップ\n③ 画面下部の「印刷・保存」ボタンで印刷またはPDF保存\n\n宛名は発行画面で任意入力できます（未入力の場合はアカウント名が使用されます）。\n消費税は食品の軽減税率（8%）で自動計算されます。',
      },
      {
        q: '価格はどのように決まっていますか？',
        a: 'おすそわけ袋の価格は各店舗が設定します。通常の販売価格より大幅に割引（50〜70%オフ程度）された価格で提供されています。',
      },
      {
        q: '決済情報は安全ですか？',
        a: 'カード情報はアプリ・サーバーに一切保存されません。国際基準のセキュリティ認証（PCI DSS準拠）を持つ決済パートナーが安全に管理します。',
      },
    ],
  },
  {
    id: 'trouble',
    title: 'トラブル・その他',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'bg-red-100 text-red-500',
    items: [
      {
        q: '受け取った商品に問題があった場合は？',
        a: '異物混入・著しく品質が低い場合は、証拠写真を添えて下記LINEサポートまでご連絡ください。内容を確認の上、対応を検討いたします。なお、おすそわけ袋の性質上、見た目や量が期待と異なる場合がありますがその場合は返金対象外となります。',
      },
      {
        q: 'お店が閉まっていた・商品を受け取れなかった場合は？',
        a: '臨時休業などでお店が閉まっており商品を受け取れなかった場合は、写真を撮っておき、LINEサポートまでご連絡ください。状況を確認のうえ、対応いたします。',
      },
      {
        q: 'アプリが正常に動作しない場合は？',
        a: 'まずアプリを再読み込み（リロード）してお試しください。それでも改善しない場合は、お使いのブラウザ・OSのバージョンを最新に更新してみてください。解決しない場合はLINEサポートまでお問い合わせください。',
      },
      {
        q: 'アカウントを削除したい場合は？',
        a: 'アプリ内「マイページ」→「アカウント設定」→「アカウント削除（退会）」から手続きできます。削除後はデータを復元できませんのでご注意ください。',
      },
      {
        q: 'お気に入り店舗はどこで確認できますか？',
        a: '画面下のナビバーにある「お気に入り」からいつでも確認できます。店舗ページのハートマークをタップして登録・解除できます。',
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   店舗（出品者）向け FAQ
   ※ Stripeダッシュボードへのログインは不可（Custom Connect）
   ※ 振込スケジュール変更はオーナー側では不可
   ※ 売上確認はアプリ内のみ
───────────────────────────────────────────── */
const STORE_FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'store-register',
    title: '登録・出品について',
    icon: <Store className="w-5 h-5" />,
    color: 'bg-orange-100 text-primary',
    items: [
      {
        q: 'お店として出品するにはどうすればいいですか？',
        a: 'マイページの「お店を登録する」から、店舗名・住所・営業許可証などの情報をアップロードして申請してください。\n\n運営スタッフが内容を確認し、通常1〜2営業日以内に審査結果をお知らせします。承認後すぐに初期費用なしで出品を開始できます。\n\n【出品開始までの流れ】\n① 店舗審査（1〜2営業日）\n② 口座登録（店舗ダッシュボードで銀行口座を登録）\n③ 決済システムの本人確認（通常3〜5営業日）\n④ 本人確認が通り次第、自動で出品が解除されます\n\n②・③が完了するまで出品はできません。本人確認完了後に初めて出品・販売・振込がすべて開始されます。',
      },
      {
        q: '出品価格に制限はありますか？',
        a: 'システムの都合上、最低¥50以上の価格設定が必要です。\n\n¥0（無料おすそわけ）での出品はシステム上対応しておりません。フードロス削減の観点から、通常販売価格の30〜50%程度の割引価格での出品を推奨しています。',
      },
      {
        q: '出品できる商品の種類に制限はありますか？',
        a: '当日または翌日中に消費される食品（惣菜・パン・スイーツ・弁当・野菜・乳製品など）が対象です。アルコール類・生の魚介類（刺身など）は現時点では対象外となります。\n\nご不明な場合はLINEサポートにご相談ください。',
      },
    ],
  },
  {
    id: 'store-payment',
    title: '売上・振込について',
    icon: <Banknote className="w-5 h-5" />,
    color: 'bg-green-100 text-green-600',
    items: [
      {
        q: '売上はいつ、どのように振り込まれますか？',
        a: '振込先情報（銀行口座）を登録いただくと、売上からOsusowakeの手数料を差し引いた金額が自動的に登録口座へ振り込まれます。\n\n振込サイクルは毎週月曜日です。ただし売上確定から振込まで、決済システムの処理上4〜7日程度かかります（例：月曜の売上は翌週月曜に振込）。\n\nスケジュールの変更はできません。詳しくはLINEサポートまでお問い合わせください。',
      },
      {
        q: 'プラットフォーム手数料はいくらですか？',
        a: '販売成立時のみ、販売金額の25%をプラットフォーム手数料として申し受けます。初期費用・月額費用は一切かかりません。\n\nまた、決済手数料（3.6%）が別途かかります。例：¥500の商品の場合、お振込額は約¥357になります（¥500 − ¥125 − ¥18）。',
      },
      {
        q: '売上の確認はどこでできますか？',
        a: 'アプリ内「売上管理」画面からご確認いただけます。月別の売上サマリー・個別の取引履歴をいつでも確認できます。\n\n売上はOsusowakeの管理システムで一括管理しているため、外部サービスへのログインは不要です。',
      },
    ],
  },
  {
    id: 'store-receipt',
    title: '領収書・税務について',
    icon: <Receipt className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-600',
    items: [
      {
        q: '購入者への領収書は発行する必要がありますか？',
        a: 'いいえ、店舗側で個別に発行する必要はありません。\n\n購入者はアプリ内「マイページ → 購入履歴」から自分で電子領収書を発行できます。領収書にはご自身の店舗名・住所・電話番号が発行元として自動表示されます。紙での領収書発行やメール対応は一切不要です。',
      },
      {
        q: '消費税の扱いはどうなりますか？',
        a: '出品価格は税込価格として設定してください。アプリ上では税込の表示価格がそのまま決済されます。\n\n税務処理については、各店舗の会計担当者または税理士にご相談ください。売上の取引履歴はアプリ内「売上管理」から確認できます。',
      },
    ],
  },
  {
    id: 'store-fee',
    title: '手数料・コスト',
    icon: <BadgePercent className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-600',
    items: [
      {
        q: '月額や初期費用はかかりますか？',
        a: 'Osusowakeの利用開始にあたって、月額費用や初期費用は一切かかりません。販売成立時のみ手数料が発生する、完全成果報酬型です。\n\n売れなかった場合のコストは¥0です。',
      },
      {
        q: '振込先情報の登録に費用はかかりますか？',
        a: '振込先情報（銀行口座）の登録・維持費用は無料です。\n\n決済手数料（3.6%/件）はOsusowakeのプラットフォーム手数料（25%）とは別に、決済システムの利用料として販売金額から自動的に差し引かれます。',
      },
      {
        q: 'アカウントを削除したい場合は？',
        a: 'アプリ内「マイページ」→「アカウント設定」→「アカウント削除（退会）」から手続きできます。出品中のバッグは事前に削除してから退会手続きをお願いします。削除後はデータを復元できませんのでご注意ください。',
      },
    ],
  },
];

/* ─────────────────── コンポーネント ─────────────────── */

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 py-4 px-4 text-left tap-opacity"
      >
        <span className="mt-0.5 text-primary font-black text-xs shrink-0 bg-primary/10 rounded px-1.5 py-0.5 leading-5">Q</span>
        <span className="flex-1 text-sm font-semibold text-foreground leading-snug">{item.q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex gap-3">
              <span className="mt-0.5 text-blue-600 font-black text-xs shrink-0 bg-blue-50 dark:bg-blue-950 rounded px-1.5 py-0.5 leading-5">A</span>
              <div className="text-sm text-muted-foreground leading-relaxed flex-1 space-y-1.5">
                {item.a.split('\n\n').map((para, pi) => (
                  <p key={pi}>{para}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqSectionBlock({ section }: { section: FaqSection }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
          {section.icon}
        </div>
        <h2 className="font-black text-sm text-foreground">{section.title}</h2>
      </div>
      {section.items.map((item, i) => (
        <FaqAccordion key={i} item={item} />
      ))}
    </div>
  );
}

export default function HelpPage() {
  const { profile } = useAuth();

  // URL パラメータ ?mode=store で強制的に店舗向けを表示（店舗ダッシュボードからのリンク用）
  const urlMode = new URLSearchParams(window.location.search).get('mode');

  // ロール判定: store_owner または ?mode=store → 店舗向けのみ表示
  const isStoreMode = urlMode === 'store' || profile?.role === 'store_owner';

  return (
    <Layout showBottomNav>
      <div className="max-w-md mx-auto px-4 pt-4 pb-28">

        {/* 戻るボタン */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 -ml-1 tap-opacity"
          aria-label="前の画面に戻る"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">ヘルプ・お問い合わせ</h1>
            <p className="text-xs text-muted-foreground mt-0.5">よくあるご質問をまとめました</p>
          </div>
        </div>

        {/* ロール別ラベル（タブなし）*/}
        <div className="flex items-center gap-2 mb-5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
            isStoreMode
              ? 'bg-primary/10 text-primary'
              : 'bg-sky-100 text-sky-700'
          }`}>
            {isStoreMode ? '🏪 店舗オーナー向け' : '👤 ユーザー向け'}
          </div>
        </div>

        {/* FAQ コンテンツ */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isStoreMode ? 'store' : 'user'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {!isStoreMode
              ? USER_FAQ_SECTIONS.map(s => <FaqSectionBlock key={s.id} section={s} />)
              : (
                <>
                  {/* 店舗向けヒーローバナー */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">飲食店・食料品店の方へ</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        月額・初期費用は¥0。売れた時だけ25%の手数料をいただく完全成果報酬制です。売上確認もアプリ内で完結します。
                      </p>
                    </div>
                  </div>
                  {STORE_FAQ_SECTIONS.map(s => <FaqSectionBlock key={s.id} section={s} />)}
                </>
              )
            }
          </motion.div>
        </AnimatePresence>

        {/* LINE Support */}
        <div className="mt-8 bg-gradient-to-br from-[#06C755]/10 to-[#06C755]/5 border-2 border-[#06C755]/30 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#06C755] rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-foreground text-sm">解決しない場合はこちら</p>
              <p className="text-xs text-muted-foreground mt-0.5">LINEで直接サポートします</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            FAQで解決しないご不明点・トラブルは、LINE公式アカウントにお気軽にメッセージをどうぞ。
            営業時間内（平日10:00〜18:00）にできるだけ早くご返信します。
          </p>
          <a
            href="https://lin.ee/x3IQZkL"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] transition-all text-white font-black py-4 rounded-xl shadow-md shadow-[#06C755]/25"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEでサポートに問い合わせる
          </a>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/legal" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            特定商取引法に基づく表記
          </Link>
          <span className="text-muted-foreground/40 text-xs">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            利用規約
          </Link>
          <span className="text-muted-foreground/40 text-xs">|</span>
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            プライバシーポリシー
          </Link>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/50 mt-3">© 2025 Osusowake All rights reserved.</p>

      </div>
    </Layout>
  );
}
