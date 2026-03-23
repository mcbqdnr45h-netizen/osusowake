import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import {
  Building2, ChevronLeft, Loader2, CheckCircle2,
  AlertCircle, ShieldCheck, Info, CreditCard,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK ?? '');

export default function StripeBankSetup() {
  const [, navigate] = useLocation();
  const { store, loading: loadingStore } = useMyStore();

  const [bankName, setBankName]           = useState('');
  const [bankCode, setBankCode]           = useState('');
  const [branchCode, setBranchCode]       = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName]       = useState('');
  const [tosAgreed, setTosAgreed]         = useState(false);
  const [tosTime, setTosTime]             = useState<number | null>(null);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const handleTosChange = (checked: boolean) => {
    setTosAgreed(checked);
    setTosTime(checked ? Date.now() : null);
  };

  const canSubmit =
    !loading &&
    tosAgreed &&
    bankCode.length === 4 &&
    branchCode.length === 3 &&
    accountNumber.length >= 1 &&
    holderName.trim().length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !tosAgreed || !tosTime || !canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripeの読み込みに失敗しました。ページを再読み込みしてください。');

      const routingNumber = bankCode.padStart(4, '0') + branchCode.padStart(3, '0');

      const result = await (stripe as any).createToken('bank_account', {
        country: 'JP',
        currency: 'jpy',
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: holderName.trim(),
        account_holder_type: 'individual',
      });

      if (result.error) {
        const msg = result.error.message ?? '口座情報が正しくありません。入力内容をご確認ください。';
        setError(msg);
        return;
      }

      const res = await fetch(`/api/stores/${store.id}/connect/bank-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankToken: result.token.id,
          tosTimestamp: tosTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? '登録に失敗しました。しばらく後でお試しください。');
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/mypage'), 2500);
    } catch (err: any) {
      setError(err?.message ?? '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  if (loadingStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="font-black text-gray-900 mb-1">店舗が見つかりません</p>
          <p className="text-sm text-gray-500 mb-4">先に店舗申請を完了してください。</p>
          <button
            onClick={() => navigate('/store-onboarding')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl"
          >
            店舗申請へ
          </button>
        </div>
      </div>
    );
  }

  if (store.status === 'applied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">口座登録済み・審査中</h2>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            銀行口座の登録が完了しています。<br />
            管理者の審査が完了次第、出品が開始できます。
          </p>
          <button
            onClick={() => navigate('/mypage')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl w-full"
          >
            マイページへ
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">登録完了！</h2>
          <p className="text-gray-500 text-sm">銀行口座の登録が完了しました。</p>
          <p className="text-gray-400 text-xs mt-1">ダッシュボードへ移動中...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">

        {/* ── ヘッダー ── */}
        <div className="flex items-center gap-3 py-5">
          <button
            onClick={() => navigate('/store-dashboard')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">振込先口座を登録</h1>
            <p className="text-xs text-gray-500">売上の受取口座を設定します</p>
          </div>
        </div>

        {/* ── セキュリティ説明バナー ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            口座情報はStripeのセキュアなサーバーで直接処理されます。タベロスのサーバーには口座番号は一切保存されません。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── 銀行情報 ── */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              銀行情報
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                銀行名
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="例：三菱UFJ銀行"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  銀行コード（4桁）
                </label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0005"
                  required
                  maxLength={4}
                  inputMode="numeric"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors font-mono tracking-widest"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  支店コード（3桁）
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="001"
                  required
                  maxLength={3}
                  inputMode="numeric"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors font-mono tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* ── 口座情報 ── */}
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              口座情報
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                口座番号
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="1234567"
                required
                maxLength={8}
                inputMode="numeric"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors font-mono tracking-widest"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                口座名義（カタカナ）
              </label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="タナカ タロウ"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1.5">通帳に記載されているカタカナ表記でご入力ください</p>
            </div>
          </div>

          {/* ── ToS 同意 ── */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={tosAgreed}
                onClick={() => handleTosChange(!tosAgreed)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  tosAgreed ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                }`}
              >
                {tosAgreed && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
              <p className="text-sm text-gray-700 leading-relaxed">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 font-bold underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  タベロスの利用規約
                </a>
                および
                <a
                  href="https://stripe.com/jp/connect-account/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 font-bold underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Stripe連結アカウント利用規約
                </a>
                に同意します
              </p>
            </label>
          </div>

          {/* ── エラー表示 ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 送信ボタン ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />処理中...</>
            ) : (
              <>口座を登録して完了する</>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>口座情報はStripeのサーバーで安全に処理されます</span>
          </div>
        </form>
      </div>
    </div>
  );
}
