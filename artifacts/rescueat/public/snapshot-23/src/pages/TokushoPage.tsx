import React from 'react';
import { Layout } from '@/components/Layout';
import { Scale, ChevronLeft } from 'lucide-react';

const ROWS: { label: string; value: React.ReactNode }[] = [
  { label: '販売事業者名', value: 'Osusowake 事務局' },
  { label: '運営責任者', value: '佐藤勇飛' },
  { label: 'メールアドレス', value: <a href="mailto:hello@osusowakejapan.org" className="text-primary underline underline-offset-2">hello@osusowakejapan.org</a> },
  { label: '所在地', value: '請求があった場合は遅滞なく開示いたします' },
  { label: '電話番号', value: '請求があった場合は遅滞なく開示いたします' },
  { label: 'サービス名称', value: 'Osusowake' },
  { label: 'サービスの内容', value: '食品ロス削減を目的とした、飲食店・小売店の余剰食品をお客様が割引価格で購入できるマッチングプラットフォーム' },
  { label: '販売価格', value: '各商品ページに表示された価格（税込）' },
  { label: '支払方法', value: 'クレジットカード決済（Visa・Mastercard・American Express・JCB）' },
  { label: '支払時期', value: '注文確定時に決済されます' },
  { label: '商品の引渡し時期', value: '購入完了後、電子チケット（QRコード）を即時発行。各店舗指定の受取時間内にご来店いただき商品を受け取ってください' },
  { label: '返品・キャンセルについて', value: '食品の特性上、注文確定後のキャンセル・返品・返金は原則お受けできません。ただし、商品未提供・システムエラーによる二重決済など当社の責に帰すべき事由がある場合はこの限りではありません' },
  { label: '動作環境', value: 'iOS / Android の最新ブラウザ（Safari / Chrome）推奨' },
  { label: '手数料', value: '各店舗の販売価格に含まれます。購入者から別途手数料はいただきません' },
];

export default function TokushoPage() {
  return (
    <Layout showBottomNav={false}>
      <div className="max-w-md mx-auto">

        {/* ヘッダー */}
        <div className="sticky z-10 bg-background/90 backdrop-blur-sm border-b border-border/50 px-4 h-14 flex items-center gap-3"
          style={{ top: 'env(safe-area-inset-top)' }}>
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <h1 className="text-base font-black text-foreground">特定商取引法に基づく表記</h1>
          </div>
        </div>

        <div className="px-4 pt-6">

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {ROWS.map((row, i) => (
            <div key={i} className={`flex gap-4 px-4 py-3.5 ${i < ROWS.length - 1 ? 'border-b border-border/60' : ''}`}>
              <dt className="text-xs font-bold text-muted-foreground w-28 shrink-0 leading-relaxed pt-0.5">{row.label}</dt>
              <dd className="text-sm text-foreground leading-relaxed flex-1">{row.value}</dd>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mt-6 px-1">
          ※ 各店舗が独自に設定した価格・受取時間・商品内容は、各店舗が責任を持って管理します。プラットフォームとしての当社は、店舗と購入者のマッチングサービスを提供するものです。
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">最終更新：2026年3月26日</p>

        </div>
      </div>
    </Layout>
  );
}
