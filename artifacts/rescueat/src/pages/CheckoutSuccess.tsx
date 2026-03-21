import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  CheckCircle2, Coins, Sparkles, Package, Store,
  Clock, QrCode, ChevronRight, Home, Copy, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';

const POINT_RATE = 0.03;

interface OrderReceipt {
  status: string;
  reservationId: number;
  pickupCode: string | null;
  bagTitle: string | null;
  storeName: string | null;
  totalPrice: number;
  pickupStart: string | null;
  pickupEnd: string | null;
}

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const reservationId = params.get('reservation_id');

  useEffect(() => {
    if (!sessionId || !reservationId) {
      setLoading(false);
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId}&reservation_id=${reservationId}`)
      .then(r => r.json())
      .then((data) => {
        setReceipt(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePop = () => navigate('/my-reservations');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [navigate]);

  function copyCode() {
    if (!receipt?.pickupCode) return;
    navigator.clipboard.writeText(receipt.pickupCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  const pointsEarned = receipt ? Math.floor(receipt.totalPrice * POINT_RATE) : 0;

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">決済を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="max-w-md mx-auto">

        {/* ── 成功ヘッダー ── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          className="flex flex-col items-center text-center mb-6"
        >
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-black text-foreground">レスキュー完了！</h1>
          <p className="text-muted-foreground text-sm mt-1">お支払いが確認されました 🎉</p>
        </motion.div>

        {/* ── レスキュー受付票 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-4"
        >
          {/* 受付票ヘッダー */}
          <div className="bg-primary px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-foreground" />
              <span className="text-primary-foreground font-black text-sm">レスキュー受付票</span>
            </div>
            {reservationId && (
              <span className="text-primary-foreground/80 text-xs font-mono">
                #{reservationId.padStart ? reservationId : `${reservationId}`.padStart(6, '0')}
              </span>
            )}
          </div>

          <div className="p-5 space-y-3.5">
            {/* 店舗名 */}
            {receipt?.storeName && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">お店</p>
                  <p className="font-black text-foreground">{receipt.storeName}</p>
                </div>
              </div>
            )}

            {/* 商品名 */}
            {receipt?.bagTitle && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">商品</p>
                  <p className="font-bold text-foreground">{receipt.bagTitle}</p>
                </div>
              </div>
            )}

            {/* 受取時間 */}
            {(receipt?.pickupStart || receipt?.pickupEnd) && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">受取時間</p>
                  <p className="font-bold text-foreground">
                    {receipt.pickupStart}{receipt.pickupEnd ? ` 〜 ${receipt.pickupEnd}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* 支払金額 */}
            {receipt?.totalPrice !== undefined && (
              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-sm font-bold text-muted-foreground">お支払い金額</span>
                <span className="text-xl font-black text-foreground">¥{receipt.totalPrice.toLocaleString()}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── 受取コード ── */}
        {receipt?.pickupCode && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border-2 border-primary/30 rounded-2xl p-5 mb-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-primary" />
              <p className="text-sm font-black text-foreground">お店での受取コード</p>
              <span className="ml-auto text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">店員に見せてください</span>
            </div>
            <div className="bg-primary/5 rounded-xl py-5 flex items-center justify-center mb-3">
              <span className="text-5xl font-black font-mono tracking-[0.25em] text-primary">
                {receipt.pickupCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-bold text-muted-foreground"
            >
              {codeCopied ? (
                <><Check className="w-4 h-4 text-green-500" /><span className="text-green-500">コピーしました</span></>
              ) : (
                <><Copy className="w-4 h-4" />コードをコピー</>
              )}
            </button>
          </motion.div>
        )}

        {/* ── 獲得ポイント ── */}
        {pointsEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-4 shadow-lg shadow-amber-200/50 mb-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-bold">今回のレスキューで獲得！</p>
              <p className="text-white font-black text-2xl">+{pointsEarned} pt</p>
            </div>
          </motion.div>
        )}

        {/* ── ナビゲーション ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/my-reservations')}
            className="w-full h-13 bg-primary text-primary-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 py-4 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Package className="w-5 h-5" />
            予約一覧を確認する
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full h-13 bg-secondary text-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 py-3.5 hover:bg-secondary/80 transition-colors"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </button>
        </motion.div>

      </div>
    </div>
  );
}
