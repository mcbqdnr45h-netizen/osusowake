import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface ReviewTarget {
  id: number;
  storeId: number;
  store?: { name?: string } | null;
}

interface ReviewModalProps {
  reservation: ReviewTarget;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', '悪い', '微妙', '普通', '良い', '最高！'];
  const display = hovered || value;
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-9 h-9 transition-colors ${n <= display ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
            />
          </button>
        ))}
      </div>
      {display > 0 && (
        <p className="text-sm font-bold text-amber-600">{labels[display]}</p>
      )}
    </div>
  );
}

export function ReviewModal({ reservation, userId, onClose, onSuccess }: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/stores/${reservation.storeId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reservationId: reservation.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (res.status === 409) {
        toast({ title: '投稿済みです', description: 'この注文の口コミは既に投稿されています', variant: 'destructive' });
        onClose();
        return;
      }
      if (!res.ok) throw new Error('failed');
      toast({ title: '口コミを投稿しました！', description: 'ありがとうございます 🌟' });
      onSuccess?.();
      onClose();
    } catch {
      toast({ title: '送信に失敗しました', description: 'もう一度お試しください', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-black">口コミを書く</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                {reservation.store?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
              総合評価 <span className="text-destructive">*</span>
            </label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
              コメント（任意）
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="商品の感想、スタッフの対応、また利用したいかなど..."
              maxLength={400}
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <div className="text-right text-xs text-muted-foreground/60 mt-1">{comment.length}/400</div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Star className="w-4 h-4 fill-white" />
                口コミを投稿する
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2.5 text-sm text-muted-foreground py-2.5 hover:text-foreground transition-colors"
          >
            あとで書く
          </button>
        </div>
      </motion.div>
    </div>
  );
}
