import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  /** 店舗オーナの場合は誤操作防止のため2段階確認にする */
  isStoreOwner?: boolean;
}

/**
 * 退会（アカウント削除）の厳格確認モーダル
 * - 共通: 「退会する」と入力しないと削除ボタンが有効化されない
 * - 店舗オーナー: 入力後さらに「最終確認」フェーズを挟む
 * MyPage と Settings の両方から使う共通実装。
 */
export function DeleteAccountModal({
  onClose,
  onConfirm,
  deleting,
  isStoreOwner = false,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [phase, setPhase] = useState<'input' | 'final'>('input');
  const canProceed = confirmText === '退会する';

  const handlePrimary = () => {
    if (deleting) return;
    if (!canProceed) return;
    if (isStoreOwner && phase === 'input') {
      setPhase('final');
      return;
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-0 md:px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="text-lg font-black text-foreground">
              {phase === 'final' ? '本当によろしいですか？' : 'アカウント削除（退会）'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            disabled={deleting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {phase === 'input' ? (
          <div className="px-6 py-5 space-y-4">
            {/* 警告 */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-black text-destructive">全てのデータが完全に削除されます</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>アカウント情報・ログイン資格情報</li>
                  {isStoreOwner ? (
                    <>
                      <li>店舗ページ・店舗情報・地図ピン</li>
                      <li>出品中の商品・予約履歴・売上記録</li>
                      <li>Stripe 連携情報・お振込先設定</li>
                    </>
                  ) : (
                    <>
                      <li>購入履歴・電子チケット</li>
                      <li>お気に入り店舗・設定</li>
                    </>
                  )}
                </ul>
                <p className="text-xs font-bold text-destructive mt-2">この操作は取り消せません。</p>
              </div>
            </div>

            {/* 確認入力 */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">
                確認のため「<span className="text-foreground font-black">退会する</span>」と入力してください
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="退会する"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive transition-colors"
              />
            </div>

            {/* ボタン群 */}
            <div className="flex gap-3 pt-1 pb-2">
              <button
                onClick={onClose}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                onClick={handlePrimary}
                disabled={!canProceed || deleting}
                className="flex-1 py-3.5 rounded-xl font-black text-sm text-white bg-destructive hover:bg-destructive/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />削除中...</>
                ) : isStoreOwner ? (
                  <>次へ</>
                ) : (
                  <><Trash2 className="w-4 h-4" />アカウントを削除する</>
                )}
              </button>
            </div>
          </div>
        ) : (
          // 店舗オーナ専用の最終確認画面 (誤操作防止)
          <div className="px-6 py-5 space-y-4">
            <div className="bg-destructive/10 border-2 border-destructive/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm font-black text-destructive">最終確認</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-relaxed">
                店舗のすべての情報・売上履歴・予約データが完全に削除され、復元できません。
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                未受取の予約があるお客様への対応、Stripe からの未振込分の入金には削除前の対応が必要です。
                ご不安な場合は <span className="font-bold text-foreground">hello@osusowakejapan.org</span> までご相談ください。
              </p>
            </div>

            <div className="flex gap-3 pt-1 pb-2">
              <button
                onClick={() => setPhase('input')}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
              >
                やめる
              </button>
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-xl font-black text-sm text-white bg-destructive hover:bg-destructive/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {deleting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />削除中...</>
                  : <><Trash2 className="w-4 h-4" />本当に削除する</>
                }
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
