import React from 'react';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutCancel() {
  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get('reservation_id');

  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  const origin = window.location.origin;

  const handleRetry = () => {
    window.location.replace(`${origin}${base}/checkout/${reservationId}`);
  };

  const handleGoHome = () => {
    window.location.replace(`${origin}${base}/`);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="flex flex-col items-center w-full max-w-sm"
      >
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-14 h-14 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-black text-foreground mb-2">決済をキャンセルしました</h1>
        <p className="text-muted-foreground text-sm mb-8">
          お支払いはキャンセルされました。<br />
          予約はまだ確定していません。
        </p>

        <div className="w-full space-y-3">
          {reservationId && (
            <button
              onClick={handleRetry}
              className="w-full h-13 bg-primary text-primary-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 py-3.5 hover:bg-primary/90 transition-colors shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              もう一度決済する
            </button>
          )}

          <button
            onClick={handleGoHome}
            className="w-full h-13 bg-secondary text-foreground rounded-2xl font-bold text-base flex items-center justify-center gap-2 py-3.5 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            トップに戻る
          </button>
        </div>
      </motion.div>
    </div>
  );
}
