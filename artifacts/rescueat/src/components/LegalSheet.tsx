import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TermsBody } from '@/pages/Terms';
import { PrivacyBody } from '@/pages/Privacy';

export type LegalDoc = 'terms' | 'privacy';

/**
 * 利用規約 / プライバシーポリシーをボトムシートで重ねて表示する。
 * ★ ここがポイント: 画面遷移 (wouter Link) ではなくオーバーレイなので、
 *   下にある登録フォームはアンマウントされず、入力中のデータが消えない。
 *   iOS / Android のスワイプバック有無に依存せず、両 OS で完全に同じ挙動になる。
 */
export function LegalSheet({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  // 背面スクロールロック
  useEffect(() => {
    if (!doc) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [doc]);

  const title = doc === 'terms' ? '利用規約' : 'プライバシーポリシー';

  return (
    <AnimatePresence>
      {doc && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* シート本体 */}
          <motion.div
            className="relative w-full max-w-lg bg-card rounded-t-3xl flex flex-col z-10 overflow-hidden"
            style={{ height: '90dvh', maxHeight: '90dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={e => e.stopPropagation()}
          >
            {/* ヘッダー (固定) */}
            <div className="relative shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-border rounded-full" />
              <h2 className="text-base font-black text-foreground">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="閉じる"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* スクロール本文 */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
              style={{
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {doc === 'terms' ? <TermsBody /> : <PrivacyBody />}
            </div>

            {/* フッター: 閉じる (固定) */}
            <div
              className="shrink-0 border-t border-border px-5 pt-3 bg-card"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-secondary/60 text-foreground font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform"
              >
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
