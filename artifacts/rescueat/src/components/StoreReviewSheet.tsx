import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, MoreVertical, Flag, EyeOff, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const BLOCKED_KEY = 'osusowake_blocked_reviewers_v1';

function loadBlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveBlocked(set: Set<string>) {
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage may be unavailable; fail silently
  }
}

interface Review {
  id: number;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reply?: string | null;
  repliedAt?: string | null;
}

interface StoreReviewSheetProps {
  storeId: number;
  storeName: string;
  avgRating: number;
  reviewCount: number;
  onClose: () => void;
}

function StarRow({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`${cls} shrink-0 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`}
        />
      ))}
    </div>
  );
}

/** 個別レビューの通報モーダル（Apple App Store 1.2 — UGC compliance） */
function ReviewReportModal({
  storeId,
  reviewId,
  reviewerId,
  userId,
  onClose,
  onDone,
}: {
  storeId: number;
  reviewId: number;
  reviewerId: string;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const REASONS = [
    { value: 'spam',        label: 'スパム・宣伝' },
    { value: 'harassment',  label: '誹謗中傷・嫌がらせ' },
    { value: 'hate',        label: 'ヘイトスピーチ・差別' },
    { value: 'sexual',      label: 'わいせつ・不適切な表現' },
    { value: 'false_info',  label: '虚偽の情報' },
    { value: 'other',       label: 'その他' },
  ];

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: 'ログインが必要です', description: '通報するにはログインしてください', variant: 'destructive' });
        onClose();
        return;
      }
      const res = await fetch(`${BASE}/api/stores/${storeId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          reportType: 'inappropriate_review',
          comment: `[review_id=${reviewId}] [reviewer=${reviewerId}] [reason=${reason}] ${comment.trim()}`.slice(0, 500),
        }),
      });
      if (res.status === 429) {
        toast({ title: '通報済みです', description: '24時間以内に既に通報されています', variant: 'destructive' });
        onClose();
        return;
      }
      if (!res.ok) throw new Error('failed');
      setDone(true);
      onDone();
    } catch {
      toast({ title: '送信に失敗しました', description: 'もう一度お試しください', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="bg-card w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-black">口コミを通報する</h3>
              <p className="text-xs text-muted-foreground mt-0.5">不適切な内容を運営に報告します</p>
            </div>
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-black text-lg mb-2">ご報告ありがとうございます</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                内容を確認し、必要に応じて速やかに対処いたします。
              </p>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all"
              >
                閉じる
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  通報理由 <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'bg-primary/10 border-primary text-foreground font-bold'
                          : 'bg-secondary border-border text-foreground/80 hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                  詳細（任意）
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="補足情報があればご記入ください"
                  maxLength={300}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
                <div className="text-right text-xs text-muted-foreground/60 mt-1">{comment.length}/300</div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>運営は通報内容を確認し、規約違反と判断した場合に該当コンテンツを非表示・削除し、悪質な場合は投稿者のアカウントを停止します。</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    通報を送信する
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function StoreReviewSheet({ storeId, storeName, avgRating, reviewCount, onClose }: StoreReviewSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [reportTarget, setReportTarget] = useState<Review | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(() => loadBlocked());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE}/api/stores/${storeId}/reviews`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setReviews(data.reviews ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storeId]);

  // ── 表示するレビュー（ブロックした投稿者を除外） ──
  const visibleReviews = useMemo(
    () => reviews.filter(r => !blocked.has(r.userId)),
    [reviews, blocked]
  );

  function handleBlock(reviewerId: string) {
    const next = new Set(blocked);
    next.add(reviewerId);
    setBlocked(next);
    saveBlocked(next);
    setOpenMenuId(null);
    toast({ title: 'この投稿者を非表示にしました', description: '今後この投稿者の口コミは表示されません' });
  }

  function handleReport(review: Review) {
    setOpenMenuId(null);
    if (!user?.id) {
      toast({ title: 'ログインが必要です', description: '通報するにはログインしてください', variant: 'destructive' });
      return;
    }
    setReportTarget(review);
  }

  // ★ createPortal で document.body 直下に出す。
  //   親が <motion.div> 等で `transform` を持っていると `position: fixed` の
  //   containing block が祖先に変わってしまい、 backdrop が画面全体を覆えず
  //   シート本体も画面中央に小さく表示される (本番ユーザ報告のレイアウト崩壊)。
  if (typeof document === 'undefined') return null; // SSR / プリレンダ安全網
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '85dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-border/60">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5 truncate max-w-[220px]">{storeName}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-foreground">{Number(avgRating).toFixed(1)}</span>
              <div className="flex flex-col gap-0.5">
                <StarRow rating={Math.round(avgRating)} />
                <span className="text-xs text-muted-foreground">{reviewCount}件の口コミ</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors mt-1 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 口コミ一覧 */}
        <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(85dvh - 110px)' }}>
          {loading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="h-3 w-24 bg-muted rounded-full" />
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full" />
                  <div className="h-3 w-3/4 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-bold text-muted-foreground">
                {reviews.length === 0 ? 'まだ口コミがありません' : '表示できる口コミがありません'}
              </p>
              {reviews.length > 0 && blocked.size > 0 && (
                <button
                  onClick={() => { setBlocked(new Set()); saveBlocked(new Set()); }}
                  className="mt-3 text-xs text-primary font-bold underline underline-offset-2"
                >
                  非表示設定をリセット
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/40 px-5">
              {visibleReviews.map(review => (
                <div key={review.id} className="py-4">
                  {/* ユーザー行 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">
                          {review.userId.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <StarRow rating={review.rating} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {format(parseISO(review.createdAt), 'yyyy年M月d日', { locale: ja })}
                      </span>
                      {/* メニュー: 通報・非表示（Apple 1.2 UGC compliance） */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === review.id ? null : review.id);
                          }}
                          aria-label="その他のオプション"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === review.id}
                          className="w-7 h-7 -mr-1 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {openMenuId === review.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[10]"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.12 }}
                                role="menu"
                                className="absolute right-0 top-8 z-[20] w-44 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                              >
                                <button
                                  role="menuitem"
                                  onClick={() => handleReport(review)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                                >
                                  <Flag className="w-4 h-4 text-destructive" />
                                  <span>この口コミを通報</span>
                                </button>
                                <button
                                  role="menuitem"
                                  onClick={() => handleBlock(review.userId)}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-left border-t border-border/60"
                                >
                                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  <span>この投稿者を非表示</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* コメント */}
                  {review.comment && (
                    <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
                  )}

                  {/* 店舗オーナー返信 */}
                  {review.reply && (
                    <div className="mt-3 ml-3 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl py-2 pr-3">
                      <p className="text-[11px] font-bold text-primary mb-1">オーナーより</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{review.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 下部パディング（iOSホームバー対策） */}
          <div className="h-6" />
        </div>
      </motion.div>

      {/* 通報モーダル */}
      <AnimatePresence>
        {reportTarget && user?.id && (
          <ReviewReportModal
            storeId={storeId}
            reviewId={reportTarget.id}
            reviewerId={reportTarget.userId}
            userId={user.id}
            onClose={() => setReportTarget(null)}
            onDone={() => {
              // 通報完了後、自動的にこの投稿者を非表示にする
              if (reportTarget) {
                handleBlock(reportTarget.userId);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
