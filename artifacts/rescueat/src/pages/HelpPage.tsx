import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ChevronDown, ChevronUp, HelpCircle, ShoppingBag, CreditCard, AlertTriangle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';

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

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'order',
    title: '注文・受取について',
    icon: <ShoppingBag className="w-5 h-5" />,
    color: 'bg-orange-100 text-primary',
    items: [
      {
        q: '商品の内容は事前にわかりますか？',
        a: '「おすそ分け袋」はおすそ分け形式のため、具体的な中身は事前にお知らせできません。カテゴリ（お惣菜・パン菓子・食材など）と内容量の目安は商品ページに記載されています。アレルギーが心配な方は、受取時にお店のスタッフへ直接ご確認ください。',
      },
      {
        q: '受取方法を教えてください。',
        a: '購入後に発行される「電子チケット（QRコード）」を店舗スタッフに提示してください。アプリ内「購入履歴」→該当の注文→「チケットを表示」からいつでも確認できます。',
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
        a: '1回の注文につき1つのおすそ分け袋を購入いただけます。複数購入を希望の場合は、お店に在庫が残っていれば繰り返しご購入いただけます。',
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
        a: 'クレジットカード・デビットカード（Visa / Mastercard / American Express / JCB）に対応しています。決済はStripeを通じて安全に処理されます。',
      },
      {
        q: '支払い後のキャンセル・返金はできますか？',
        a: '食品の特性上、原則として返金はお受けできません。ただし、商品未提供・二重決済など明らかなシステムトラブルの場合はご対応いたします。下記LINEサポートまでご連絡ください。',
      },
      {
        q: '領収書は発行できますか？',
        a: 'アプリ内「購入履歴」から各注文の領収書PDFをダウンロードできます。宛名はご自身でご記入ください。',
      },
      {
        q: '価格はどのように決まっていますか？',
        a: 'おすそ分け袋の価格は各店舗が設定します。通常の販売価格より大幅に割引（50〜70%オフ程度）された価格で提供されています。',
      },
      {
        q: '決済情報は安全ですか？',
        a: 'カード情報はアプリ・サーバーに一切保存されません。国際基準のセキュリティ認証（PCI DSS準拠）を持つStripeが安全に管理します。',
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
        a: '異物混入・著しく品質が低い場合は、証拠写真を添えて下記LINEサポートまでご連絡ください。内容を確認の上、対応を検討いたします。なお、おすそ分け袋の性質上、見た目や量が期待と異なる場合がありますがその場合は返金対象外となります。',
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
        a: 'アプリ内「アカウント設定」→「アカウント削除」から手続きできます。削除後はデータを復元できませんのでご注意ください。',
      },
      {
        q: '店舗として登録・出品したい場合は？',
        a: 'マイページ→「店舗として登録する」から申請できます。審査通過後、すぐにおすそ分け袋を出品いただけます。ご不明な点はLINEサポートまでお気軽にどうぞ。',
      },
      {
        q: 'お気に入り店舗はどこで確認できますか？',
        a: '画面下のナビバーにある「お気に入り」からいつでも確認できます。店舗ページのハートマークをタップして登録・解除できます。',
      },
    ],
  },
];

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
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Layout showBottomNav>
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">ヘルプ・お問い合わせ</h1>
            <p className="text-xs text-muted-foreground mt-0.5">よくあるご質問をまとめました</p>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {FAQ_SECTIONS.map(section => (
            <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Section Header */}
              <div className={`flex items-center gap-3 px-4 py-3.5 border-b border-border/60`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
                  {section.icon}
                </div>
                <h2 className="font-black text-sm text-foreground">{section.title}</h2>
              </div>

              {/* Items */}
              {section.items.map((item, i) => (
                <FaqAccordion key={i} item={item} />
              ))}
            </div>
          ))}
        </div>

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
          <Link href="/tokusho" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
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
        <p className="text-center text-[10px] text-muted-foreground/50 mt-3">© 2025 OsusOwake All rights reserved.</p>

      </div>
    </Layout>
  );
}
