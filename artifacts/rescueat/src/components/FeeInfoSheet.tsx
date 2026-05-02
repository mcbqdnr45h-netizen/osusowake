import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { calculateFeeBreakdown } from '@/lib/stock-urgency';

interface FeeInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  basePrice: number;
}

export function FeeInfoSheet({ isOpen, onClose, basePrice }: FeeInfoSheetProps) {
  const { subtotal, fee, total } = calculateFeeBreakdown(basePrice, 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-md bg-card rounded-t-3xl md:rounded-3xl px-6 pt-5 pb-8 z-10 shadow-2xl"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 md:hidden" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-all active:scale-90"
              aria-label="閉じる"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center shadow-sm">
                <Receipt className="w-6 h-6 text-amber-700 dark:text-amber-400" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-lg font-black leading-tight">システム利用料について</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">透明性のためご説明します</p>
              </div>
            </div>

            {/* 価格内訳カード — 黄金比に近い余白で組む */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-stone-50/50 dark:to-stone-900/30 overflow-hidden shadow-sm">
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">商品価格</span>
                  <span className="font-bold tabular-nums" style={{ fontFeatureSettings: '"tnum"' }}>
                    ¥{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    システム利用料
                    <span className="inline-flex items-center text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full">5%</span>
                  </span>
                  <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400" style={{ fontFeatureSettings: '"tnum"' }}>
                    +¥{fee.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="border-t border-border/60 bg-gradient-to-br from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3.5 flex items-center justify-between">
                <span className="text-[13px] font-black text-foreground">お支払い合計</span>
                <span className="text-[22px] font-black text-[#5C3A1F] dark:text-[#C4956A] tabular-nums tracking-tight" style={{ fontFeatureSettings: '"tnum"' }}>
                  ¥{total.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/80 text-center mt-2 mb-5 leading-relaxed">
              ※ 10円単位で四捨五入されます
            </p>

            {/* 利用料の使い道 — 信頼性訴求 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-foreground leading-tight">食品ロス削減の活動を支えます</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    お店とユーザーをつなぎ、廃棄予定の食品を救う仕組みの運営に使われます。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-foreground leading-tight">安心・安全な決済環境</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Stripeによる業界標準のセキュア決済と、トラブル時のサポートを提供します。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-foreground leading-tight">アプリの継続的な改善</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    新機能の開発・サーバー維持・カスタマーサポートに充てられます。
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 bg-gradient-to-br from-[#5C3A1F] to-[#3D2814] hover:from-[#6B4525] hover:to-[#4A2F18] text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#5C3A1F]/20"
            >
              わかりました
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
