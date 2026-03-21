import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle2, Coins, Sparkles, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const POINT_RATE = 0.03;

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const [verified, setVerified] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const reservationId = params.get('reservation_id');

  useEffect(() => {
    if (!sessionId || !reservationId) {
      setVerified(true);
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId}&reservation_id=${reservationId}`)
      .then(r => r.json())
      .then(() => setVerified(true))
      .catch(() => setVerified(true));
  }, [sessionId, reservationId]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePop = () => navigate('/my-reservations');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [navigate]);

  useEffect(() => {
    if (!verified) return;
    const t = setTimeout(() => navigate('/my-reservations'), 5000);
    return () => clearTimeout(t);
  }, [verified, navigate]);

  const pointsEarned = Math.floor(totalPrice * POINT_RATE);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-primary" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <h1 className="text-2xl font-black text-foreground mb-1">レスキュー完了！</h1>
        <p className="text-muted-foreground text-sm mb-8">ご予約が確定しました 🎉</p>

        {/* Points earned */}
        {pointsEarned > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full bg-gradient-to-br from-amber-400 to-orange-400 rounded-3xl p-5 shadow-lg shadow-amber-200 mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">今回のレスキューで獲得</span>
            </div>
            <div className="text-white text-center">
              <span className="text-5xl font-black">+{pointsEarned}</span>
              <span className="text-xl font-bold ml-1">pt</span>
            </div>
          </motion.div>
        )}

        {/* Pickup reminder */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3"
        >
          <Package className="w-8 h-8 text-primary shrink-0" />
          <div className="text-left">
            <p className="text-sm font-black text-foreground">受け取りをお忘れなく</p>
            <p className="text-xs text-muted-foreground mt-0.5">指定の受取時間にお店へお越しください</p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-xs text-muted-foreground"
        >
          5秒後に予約一覧へ移動します...
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => navigate('/my-reservations')}
          className="mt-4 text-sm font-bold text-primary underline underline-offset-2"
        >
          今すぐ予約一覧へ
        </motion.button>
      </motion.div>
    </div>
  );
}
