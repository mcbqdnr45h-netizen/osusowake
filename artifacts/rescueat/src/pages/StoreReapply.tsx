import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Store, SendHorizonal } from 'lucide-react';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StoreLayout } from '@/components/StoreLayout';
import { authedFetch } from '@/lib/authed-fetch';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

const CATEGORIES = [
  { value: 'restaurant',    label: '飲食店・レストラン' },
  { value: 'bakery',        label: 'パン屋' },
  { value: 'cafe',          label: 'カフェ' },
  { value: 'supermarket',   label: 'スーパー' },
  { value: 'convenience',   label: 'コンビニ' },
  { value: 'bakery_sweets', label: 'ベーカリー・スイーツ' },
  { value: 'meals',         label: '惣菜・弁当' },
  { value: 'ingredients',   label: '食材・八百屋' },
  { value: 'other',         label: 'その他' },
];

type FormState = {
  name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  holiday: string;
  pickupHours: string;
};

type Errors = Partial<Record<keyof FormState, string>>;
type Touched = Partial<Record<keyof FormState, boolean>>;

function validate(form: FormState): Errors {
  const errs: Errors = {};
  if (!form.name.trim())    errs.name    = '店舗名は必須です';
  if (!form.address.trim()) errs.address = '住所は必須です';
  return errs;
}

const inputBase =
  'w-full px-4 py-3.5 bg-secondary/50 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-colors';
const inputNormal  = `${inputBase} border-border/50 focus:ring-primary/30`;
const inputError   = `${inputBase} border-red-400 bg-red-50/50 focus:ring-red-300`;

export default function StoreReapply() {
  const [, navigate] = useLocation();
  const { user }     = useAuth();
  const { store, loading } = useMyStore();
  const { toast }    = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: '', description: '', category: 'other',
    address: '', city: '', phone: '',
    openTime: '', closeTime: '', holiday: '', pickupHours: '',
  });
  const [touched, setTouched] = useState<Touched>({});

  useEffect(() => {
    if (store) {
      setForm({
        name:        store.name        ?? '',
        description: store.description ?? '',
        category:    store.category    ?? 'other',
        address:     store.address     ?? '',
        city:        store.city        ?? '',
        phone:       store.phone       ?? '',
        openTime:    store.openTime    ?? '',
        closeTime:   store.closeTime   ?? '',
        holiday:     store.holiday     ?? '',
        pickupHours: store.pickupHours ?? '',
      });
    }
  }, [store]);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const update = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const touch = useCallback((field: keyof FormState) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  function showError(field: keyof FormState) {
    return (submitAttempted || touched[field]) && !!errors[field];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!store || !user) return;
    if (hasErrors) return;

    setSubmitting(true);
    try {
      const res = await authedFetch(`${BASE}/api/stores/${store.id}/reapply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        toast({ title: '再申請を受け付けました。審査結果をお待ちください。' });
        setTimeout(() => navigate('/store/dashboard'), 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: '再申請に失敗しました',
          description: data?.message ?? '時間をおいて再度お試しください',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ── ローディング ── */
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── 店舗なし ── */
  if (!store) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <Store className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="font-bold text-foreground">店舗情報が見つかりません</p>
          <button onClick={() => navigate('/mypage')} className="text-primary font-bold text-sm">マイページへ戻る</button>
        </div>
      </div>
    );
  }

  /* ── 却下ステータス以外はブロック ── */
  if (store.status !== 'rejected') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-bold text-foreground">現在のステータスでは再申請できません</p>
          <button onClick={() => navigate('/store/dashboard')} className="text-primary font-bold text-sm">ダッシュボードへ</button>
        </div>
      </div>
    );
  }

  /* ── 送信完了 ── */
  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 max-w-sm md:max-w-2xl"
        >
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">再申請を受け付けました</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              審査結果は通知とメールでお知らせします。<br />審査完了までしばらくお待ちください。
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── メインフォーム ── */
  return (
    <StoreLayout showHeader={false}>
      <div className="max-w-2xl mx-auto w-full pb-36">

        {/* ヘッダー */}
        <div
          className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-foreground text-base leading-tight">再申請フォーム</h1>
              <p className="text-[10px] text-muted-foreground">{store.name}</p>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="px-4 pt-5 space-y-5">

          {/* ① 却下理由（最優先表示） */}
          <AnimatePresence>
            {store.rejectionReason ? (
              <motion.div
                key="rejection"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-300 rounded-2xl overflow-hidden"
              >
                <div className="bg-red-500 px-4 py-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs font-black text-white tracking-wide">管理者からの却下理由</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-red-700 leading-relaxed font-medium">{store.rejectionReason}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-reason"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 leading-relaxed">申請が却下されました。下記の内容を確認・修正して再申請してください。</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ② 案内文 */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              上記の却下理由を参考に情報を修正・確認し、再申請してください。
              承認されるまで店舗は一般公開されません。
            </p>
          </div>

          {/* 店舗名 ★必須 */}
          <div>
            <label className="flex items-center gap-1 text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">
              店舗名
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              onBlur={() => touch('name')}
              placeholder="例：タップスバーガーショップ"
              className={showError('name') ? inputError : inputNormal}
            />
            <AnimatePresence>
              {showError('name') && (
                <motion.p
                  key="err-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />{errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">カテゴリ</label>
            <select
              value={form.category}
              onChange={e => update('category', e.target.value)}
              className={inputNormal}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 店舗説明 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">店舗説明</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={3}
              placeholder="お店の特徴や取り扱い商品など"
              className={`${inputNormal} resize-none`}
            />
          </div>

          {/* 住所 ★必須 */}
          <div>
            <label className="flex items-center gap-1 text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">
              住所
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={e => update('address', e.target.value)}
              onBlur={() => touch('address')}
              placeholder="例：大阪府高槻市城北町2-2-15"
              className={showError('address') ? inputError : inputNormal}
            />
            <AnimatePresence>
              {showError('address') && (
                <motion.p
                  key="err-address"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />{errors.address}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* 市区町村 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">市区町村</label>
            <input
              type="text"
              value={form.city}
              onChange={e => update('city', e.target.value)}
              placeholder="例：高槻市"
              className={inputNormal}
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">電話番号</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="例：072-xxx-xxxx"
              className={inputNormal}
            />
          </div>

          {/* 営業時間 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">営業時間</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground font-bold mb-1.5">開店時間</p>
                <input
                  type="time"
                  value={form.openTime}
                  onChange={e => update('openTime', e.target.value)}
                  className={inputNormal}
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-bold mb-1.5">閉店時間</p>
                <input
                  type="time"
                  value={form.closeTime}
                  onChange={e => update('closeTime', e.target.value)}
                  className={inputNormal}
                />
              </div>
            </div>
          </div>

          {/* 受取可能時間 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">受取可能時間</label>
            <input
              type="text"
              value={form.pickupHours}
              onChange={e => update('pickupHours', e.target.value)}
              placeholder="例：10:00〜20:00"
              className={inputNormal}
            />
          </div>

          {/* 定休日 */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2 uppercase tracking-wider">定休日</label>
            <input
              type="text"
              value={form.holiday}
              onChange={e => update('holiday', e.target.value)}
              placeholder="例：月曜日・祝日"
              className={inputNormal}
            />
          </div>

          {/* 必須エラーまとめ（送信試みた後） */}
          <AnimatePresence>
            {submitAttempted && hasErrors && (
              <motion.div
                key="submit-error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 font-bold">
                  {Object.values(errors).join('・')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 送信ボタン */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className={[
                'w-full h-16 rounded-2xl font-black text-base flex items-center justify-center gap-2.5',
                'transition-all active:scale-[0.98]',
                submitting || (submitAttempted && hasErrors)
                  ? 'bg-primary/50 text-white/70 cursor-not-allowed'
                  : 'bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-primary/40',
              ].join(' ')}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  送信中…
                </>
              ) : (
                <>
                  <SendHorizonal className="w-5 h-5" />
                  再申請する
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground mt-3 leading-relaxed">
              送信後、審査結果は通知とメールにてお知らせします（通常1〜2営業日）
            </p>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}
