import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, ChevronLeft, Loader2, CheckCircle2,
  AlertCircle, ShieldCheck, Info, CreditCard, PartyPopper,
  User, MapPin, FileText, TriangleAlert, ClipboardCheck,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK ?? '');

// ── 都道府県リスト ──────────────────────────────────────────────────
const PREFECTURES_KANJI = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];
const PREFECTURES_KANA = [
  'ホッカイドウ','アオモリケン','イワテケン','ミヤギケン','アキタケン','ヤマガタケン','フクシマケン',
  'イバラキケン','トチギケン','グンマケン','サイタマケン','チバケン','トウキョウト','カナガワケン',
  'ニイガタケン','トヤマケン','イシカワケン','フクイケン','ヤマナシケン','ナガノケン','ギフケン',
  'シズオカケン','アイチケン','ミエケン','シガケン','キョウトフ','オオサカフ','ヒョウゴケン',
  'ナラケン','ワカヤマケン','トットリケン','シマネケン','オカヤマケン','ヒロシマケン','ヤマグチケン',
  'トクシマケン','カガワケン','エヒメケン','コウチケン','フクオカケン','サガケン','ナガサキケン',
  'クマモトケン','オオイタケン','ミヤザキケン','カゴシマケン','オキナワケン',
];

function translateRequirement(key: string): string {
  const map: Record<string, string> = {
    'individual.first_name': '代表者名（名）',
    'individual.last_name': '代表者名（姓）',
    'individual.first_name_kana': '代表者名カナ（名）',
    'individual.last_name_kana': '代表者名カナ（姓）',
    'individual.dob.day': '生年月日（日）',
    'individual.dob.month': '生年月日（月）',
    'individual.dob.year': '生年月日（年）',
    'individual.address_kanji.postal_code': '住所（郵便番号）',
    'individual.address_kanji.state': '住所（都道府県）',
    'individual.address_kanji.city': '住所（市区町村）',
    'individual.address_kanji.town': '住所（町名）',
    'individual.address_kana.state': 'カナ住所（都道府県）',
    'individual.address_kana.city': 'カナ住所（市区町村）',
    'individual.address_kana.town': 'カナ住所（町名）',
    'business_profile.product_description': '事業内容の説明',
    'business_profile.url': 'ウェブサイトURL',
    'business_type': '事業形態',
    'tos_acceptance.date': '利用規約への同意',
    'external_account': '振込先口座',
    'company.name': '法人名',
    'company.name_kana': '法人名（カナ）',
    'representative.first_name': '代表者名（名）',
    'representative.last_name': '代表者名（姓）',
    'representative.first_name_kana': '代表者名カナ（名）',
    'representative.last_name_kana': '代表者名カナ（姓）',
    'representative.dob.day': '代表者 生年月日（日）',
    'representative.dob.month': '代表者 生年月日（月）',
    'representative.dob.year': '代表者 生年月日（年）',
    'representative.address_kanji.state': '代表者住所（都道府県）',
    'representative.relationship.representative': '代表者の関係性確認',
  };
  return map[key] ?? key;
}

// ── 共通 UI パーツ ──────────────────────────────────────────────────
const inputClass = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors';
const selectClass = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors bg-white';

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="font-black text-gray-900 text-base flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export default function StripeBankSetup() {
  const [, navigate] = useLocation();
  const { store, loading: loadingStore, refetch } = useMyStore();
  const { session } = useAuth();
  const notifiedRef = useRef(false);

  // ── 銀行口座情報 ──
  const [bankName, setBankName]           = useState('');
  const [bankCode, setBankCode]           = useState('');
  const [branchCode, setBranchCode]       = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName]       = useState('');
  const [tosAgreed, setTosAgreed]         = useState(false);
  const [tosTime, setTosTime]             = useState<number | null>(null);

  // ── KYC: 事業形態 ──
  const [businessType, setBusinessType] = useState<'individual' | 'company'>('individual');

  // ── KYC: 代表者氏名 ──
  const [lastNameKanji, setLastNameKanji]   = useState('');
  const [firstNameKanji, setFirstNameKanji] = useState('');
  const [lastNameKana, setLastNameKana]     = useState('');
  const [firstNameKana, setFirstNameKana]   = useState('');
  const [phone, setPhone]                   = useState('');
  const [email, setEmail]                   = useState('');

  // ── KYC: 生年月日 ──
  const [dobYear, setDobYear]   = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay]     = useState('');

  // ── KYC: 住所 ──
  const [postalCode, setPostalCode] = useState('');
  const [stateKanji, setStateKanji] = useState('');
  const [cityKanji, setCityKanji]   = useState('');
  const [townKanji, setTownKanji]   = useState('');
  const [line1Kanji, setLine1Kanji] = useState('');
  const [stateKana, setStateKana]   = useState('');
  const [cityKana, setCityKana]     = useState('');
  const [townKana, setTownKana]     = useState('');
  const [line1Kana, setLine1Kana]   = useState('');

  // ── KYC: 事業内容 ──
  const [productDescription, setProductDescription] = useState('');
  const [businessUrl, setBusinessUrl]               = useState('');

  // ── UI 状態 ──
  const [loading, setLoading]       = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [step, setStep]             = useState<'form' | 'bank_done' | 'done'>('form');
  const [kycResult, setKycResult]   = useState<{
    kycComplete: boolean;
    storeStatus: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements: {
      currentlyDue: string[];
      eventuallyDue: string[];
      errors: { code: string; reason: string; requirement: string }[];
      pendingVerification: string[];
      disabledReason: string | null;
    };
  } | null>(null);

  // ── 審査通過通知 ──
  useEffect(() => {
    if (!store || !session?.access_token) return;
    if (store.status !== 'approved') return;
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    fetch('/api/stores/notify-approval', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }, [store?.status, session?.access_token]);

  // ── 郵便番号自動補完 ──
  const lookupZip = useCallback(async (zip: string) => {
    const clean = zip.replace(/\D/g, '');
    if (clean.length !== 7) return;
    setZipLoading(true);
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`);
      const data = await res.json();
      const addr = data?.results?.[0];
      if (addr) {
        const prefIdx = PREFECTURES_KANJI.indexOf(addr.address1);
        if (prefIdx >= 0) {
          setStateKanji(PREFECTURES_KANJI[prefIdx]);
          setStateKana(PREFECTURES_KANA[prefIdx]);
        }
        setCityKanji(addr.address2 ?? '');
        setTownKanji(addr.address3 ?? '');
        setCityKana(addr.kana2 ?? '');
        setTownKana(addr.kana3 ?? '');
      }
    } catch (_) {}
    finally { setZipLoading(false); }
  }, []);

  const handlePostalCodeChange = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 7);
    setPostalCode(clean);
    if (clean.length === 7) lookupZip(clean);
  };

  const handlePrefectureChange = (idx: string) => {
    const i = parseInt(idx);
    if (isNaN(i)) return;
    setStateKanji(PREFECTURES_KANJI[i] ?? '');
    setStateKana(PREFECTURES_KANA[i] ?? '');
  };

  const handleTosChange = (checked: boolean) => {
    setTosAgreed(checked);
    setTosTime(checked ? Date.now() : null);
  };

  // ── バリデーション：不足項目リスト ──
  const missingFields: string[] = [];
  if (!lastNameKanji.trim() || !firstNameKanji.trim()) missingFields.push('代表者氏名（漢字）');
  if (!lastNameKana.trim()   || !firstNameKana.trim())  missingFields.push('代表者氏名（カタカナ）');
  if (phone.trim().length < 10)  missingFields.push(`電話番号（現在${phone.trim().length}桁 / 10桁以上）`);
  if (!email.trim().includes('@')) missingFields.push('メールアドレス（正しい形式で入力）');
  if (!dobYear || !dobMonth || !dobDay)                 missingFields.push('生年月日');
  if (postalCode.length !== 7)                          missingFields.push('郵便番号（7桁）');
  if (!stateKanji)                                      missingFields.push('都道府県');
  if (!cityKanji.trim() || !townKanji.trim())           missingFields.push('住所（市区町村・町名）漢字');
  if (!cityKana.trim()  || !townKana.trim())            missingFields.push('住所（市区町村・町名）カナ');
  if (productDescription.trim().length < 10)            missingFields.push(`事業内容の説明（現在${productDescription.trim().length}文字 / 10文字以上必要）`);
  if (bankCode.length !== 4)                            missingFields.push(`銀行コード（${bankCode.length}桁 → 4桁で入力）`);
  if (branchCode.length !== 3)                          missingFields.push(`支店コード（${branchCode.length}桁 → 3桁で入力）`);
  if (!accountNumber.trim())                            missingFields.push('口座番号');
  if (!holderName.trim())                               missingFields.push('口座名義（カタカナ）');
  if (!tosAgreed)                                       missingFields.push('利用規約への同意');

  const canSubmit = !loading && missingFields.length === 0;

  // ── 送信 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !tosAgreed || !tosTime || !canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      // ① Stripe.js でトークン生成
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripeの読み込みに失敗しました。ページを再読み込みしてください。');

      const routingNumber = bankCode.padStart(4, '0') + branchCode.padStart(3, '0');
      const result = await (stripe as any).createToken('bank_account', {
        country: 'JP', currency: 'jpy',
        routing_number: routingNumber,
        account_number: accountNumber,
        account_holder_name: holderName.trim(),
        account_holder_type: 'individual',
      });

      if (result.error) {
        setError(result.error.message ?? '口座情報が正しくありません。入力内容をご確認ください。');
        return;
      }

      // ② 銀行口座登録 API
      const bankRes = await fetch(`/api/stores/${store.id}/connect/bank-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankToken: result.token.id, tosTimestamp: tosTime }),
      });
      const bankData = await bankRes.json();
      if (!bankRes.ok) {
        setError(bankData.message ?? '銀行口座の登録に失敗しました。しばらく後でお試しください。');
        return;
      }

      setStep('bank_done');

      // ③ KYC 情報送信 API
      const kycRes = await fetch(`/api/stores/${store.id}/connect/kyc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          businessType,
          representative: {
            firstNameKanji: firstNameKanji.trim(),
            lastNameKanji:  lastNameKanji.trim(),
            firstNameKana:  firstNameKana.trim(),
            lastNameKana:   lastNameKana.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            dobYear:  parseInt(dobYear),
            dobMonth: parseInt(dobMonth),
            dobDay:   parseInt(dobDay),
            postalCode,
            stateKanji, cityKanji: cityKanji.trim(), townKanji: townKanji.trim(),
            line1Kanji: line1Kanji.trim() || undefined,
            stateKana,  cityKana:  cityKana.trim(),  townKana:  townKana.trim(),
            line1Kana:  line1Kana.trim() || undefined,
          },
          businessProfile: {
            productDescription: productDescription.trim() || undefined,
            url: businessUrl.trim() || undefined,
          },
        }),
      });
      const kycData = await kycRes.json();
      if (!kycRes.ok) {
        // KYC失敗でも銀行口座は登録済みなのでエラーを表示しつつ続行
        const fieldHint = kycData.param ? `（項目: ${kycData.param}）` : '';
        setError(`KYC情報の送信に失敗しました: ${kycData.message ?? '不明なエラー'}${fieldHint}。マイページの「本人確認情報」から再送信できます。`);
        setStep('done');
        return;
      }

      // KYC完了 → ストアキャッシュをリフレッシュして「審査中」バナーを即時消す
      if (kycData.kycComplete) {
        await refetch();
      }
      setKycResult(kycData);
      setStep('done');
    } catch (err: any) {
      setError(err?.message ?? '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // ────────── ローディング ──────────
  if (loadingStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  // ────────── 店舗なし ──────────
  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="font-black text-gray-900 mb-1">店舗が見つかりません</p>
          <p className="text-sm text-gray-500 mb-4">先に店舗申請を完了してください。</p>
          <button onClick={() => navigate('/store-onboarding')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl">
            店舗申請へ
          </button>
        </div>
      </div>
    );
  }

  // ────────── 口座登録済み（applied） ──────────
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
            本人確認情報（KYC）の入力が必要な場合はマイページからご確認ください。
          </p>
          <button onClick={() => navigate('/store/kyc-setup')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl w-full mb-3">
            本人確認情報（KYC）を入力する
          </button>
          <button onClick={() => navigate('/mypage')}
            className="border-2 border-gray-200 text-gray-600 font-bold px-6 py-3 rounded-2xl w-full">
            マイページへ戻る
          </button>
        </div>
      </div>
    );
  }

  // ────────── 完了後：結果画面 ──────────
  if (step === 'done') {
    const remaining = kycResult ? [
      ...kycResult.requirements.currentlyDue,
      ...kycResult.requirements.eventuallyDue,
    ].filter((v, i, a) => a.indexOf(v) === i) : [];
    const allClear = kycResult?.kycComplete ?? false;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">
          <div className="flex items-center gap-3 py-5">
            <button onClick={() => navigate('/store/dashboard')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-black text-gray-900">登録完了</h1>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm p-6 text-center mb-4"
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              allClear ? 'bg-green-100' : 'bg-amber-100'
            }`}>
              {allClear
                ? <CheckCircle2 className="w-10 h-10 text-green-500" />
                : <ClipboardCheck className="w-10 h-10 text-amber-500" />
              }
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
              {allClear ? '✅ Stripe連携完了！' : '銀行口座を登録しました'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {allClear
                ? 'すべての本人確認情報が揃い、Stripeアカウントの制限が解除されました。出品を開始できます！'
                : '銀行口座の登録が完了しました。本人確認情報をStripeに送信中です。'
              }
            </p>

            {kycResult && (
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  kycResult.chargesEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {kycResult.chargesEnabled ? '✅ 支払い受取：有効' : '⏳ 支払い受取：審査中'}
                </span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  kycResult.payoutsEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {kycResult.payoutsEnabled ? '✅ 振込：有効' : '⏳ 振込：審査中'}
                </span>
              </div>
            )}
          </motion.div>

          {/* エラーメッセージ（KYC失敗時） */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 残り要件 */}
          {remaining.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 text-amber-500" />
                Stripeに追加情報が必要です（{remaining.length}件）
              </h3>
              <ul className="space-y-2 mb-4">
                {remaining.map(req => (
                  <li key={req} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 shrink-0" />
                    <span className="text-gray-700">{translateRequirement(req)}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/store/kyc-setup')}
                className="w-full py-2.5 border-2 border-orange-400 text-orange-500 font-bold text-sm rounded-xl">
                KYC情報を追加入力する
              </button>
            </div>
          )}

          {/* Stripeエラー */}
          {kycResult && kycResult.requirements.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
              <h3 className="font-black text-red-700 text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Stripeからのエラー
              </h3>
              {kycResult.requirements.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">
                  <span className="font-bold">{translateRequirement(err.requirement)}</span>：{err.reason}
                </p>
              ))}
            </div>
          )}

          <button onClick={() => navigate('/store/dashboard')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg">
            ダッシュボードへ
          </button>
        </div>
      </div>
    );
  }

  // ────────── メインフォーム ──────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 py-5">
          <button onClick={() => navigate('/store/dashboard')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">口座登録 & 本人確認</h1>
            <p className="text-xs text-gray-500">売上受取口座と本人確認情報を設定します</p>
          </div>
        </div>

        {/* 🎉 審査通過バナー */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
          className="relative overflow-hidden rounded-2xl mb-5 shadow-md"
          style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF6B00 60%, #E55A00 100%)' }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative px-5 py-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-[11px] font-bold tracking-widest uppercase leading-none mb-0.5">CONGRATULATIONS</p>
                <p className="text-white font-black text-lg leading-tight">審査が通過しました！</p>
              </div>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              おめでとうございます🎊 以下の情報を登録して、<strong className="text-white">おすそ分け袋の出品</strong>を始めましょう。
            </p>
          </div>
        </motion.div>

        {/* セキュリティ説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            口座・本人確認情報はStripeのセキュアなサーバーで直接処理されます。タベロスのサーバーには口座番号は一切保存されません。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── ① 事業形態 ── */}
          <FormSection title="事業形態" icon={<Building2 className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-2 gap-3">
              {(['individual', 'company'] as const).map(t => (
                <button key={t} type="button" onClick={() => setBusinessType(t)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    businessType === t ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'
                  }`}>
                  {t === 'individual' ? '👤 個人事業主' : '🏢 法人'}
                </button>
              ))}
            </div>
          </FormSection>

          {/* ── ② 代表者氏名 ── */}
          <FormSection title="代表者氏名" icon={<User className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓（漢字）" required>
                <input type="text" value={lastNameKanji} onChange={e => setLastNameKanji(e.target.value)}
                  placeholder="山田" required className={inputClass} />
              </Field>
              <Field label="名（漢字）" required>
                <input type="text" value={firstNameKanji} onChange={e => setFirstNameKanji(e.target.value)}
                  placeholder="太郎" required className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓（カナ）" required hint="全角カタカナ">
                <input type="text" value={lastNameKana} onChange={e => setLastNameKana(e.target.value)}
                  placeholder="ヤマダ" required className={inputClass} />
              </Field>
              <Field label="名（カナ）" required hint="全角カタカナ">
                <input type="text" value={firstNameKana} onChange={e => setFirstNameKana(e.target.value)}
                  placeholder="タロウ" required className={inputClass} />
              </Field>
            </div>
            <Field label="電話番号" required hint="ハイフンなし（例: 09012345678）">
              <input type="tel" value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d+\-()]/g, ''))}
                placeholder="09012345678" inputMode="tel" required className={inputClass} />
            </Field>
            <Field label="メールアドレス" required>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="owner@example.com" required className={inputClass} />
            </Field>
          </FormSection>

          {/* ── ③ 生年月日 ── */}
          <FormSection title="生年月日" icon={<User className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-3 gap-3">
              <Field label="年" required>
                <input type="number" value={dobYear} onChange={e => setDobYear(e.target.value)}
                  placeholder="1985" min={1920} max={new Date().getFullYear() - 18}
                  required inputMode="numeric" className={inputClass} />
              </Field>
              <Field label="月" required>
                <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} required className={selectClass}>
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </Field>
              <Field label="日" required>
                <select value={dobDay} onChange={e => setDobDay(e.target.value)} required className={selectClass}>
                  <option value="">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          {/* ── ④ 住所 ── */}
          <FormSection title="住所" icon={<MapPin className="w-5 h-5 text-orange-500" />}>
            <Field label="郵便番号（ハイフンなし7桁）" required>
              <div className="relative">
                <input type="text" value={postalCode} onChange={e => handlePostalCodeChange(e.target.value)}
                  placeholder="5300001" maxLength={7} inputMode="numeric" required className={inputClass} />
                {zipLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">7桁入力で住所を自動補完します</p>
            </Field>

            <Field label="都道府県" required>
              <select value={PREFECTURES_KANJI.indexOf(stateKanji).toString()}
                onChange={e => handlePrefectureChange(e.target.value)} required className={selectClass}>
                <option value="-1">選択してください</option>
                {PREFECTURES_KANJI.map((p, i) => <option key={p} value={i}>{p}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="市区町村（漢字）" required>
                <input type="text" value={cityKanji} onChange={e => setCityKanji(e.target.value)}
                  placeholder="大阪市北区" required className={inputClass} />
              </Field>
              <Field label="町名・番地（漢字）" required>
                <input type="text" value={townKanji} onChange={e => setTownKanji(e.target.value)}
                  placeholder="梅田1-1" required className={inputClass} />
              </Field>
            </div>

            <Field label="建物名・部屋番号（任意）">
              <input type="text" value={line1Kanji} onChange={e => setLine1Kanji(e.target.value)}
                placeholder="○○ビル 101号室" className={inputClass} />
            </Field>

            {/* カナ住所 */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">住所（カタカナ）</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="市区町村（カナ）" required>
                  <input type="text" value={cityKana} onChange={e => setCityKana(e.target.value)}
                    placeholder="オオサカシキタク" required className={inputClass} />
                </Field>
                <Field label="町名・番地（カナ）" required>
                  <input type="text" value={townKana} onChange={e => setTownKana(e.target.value)}
                    placeholder="ウメダ1-1" required className={inputClass} />
                </Field>
              </div>
              <Field label="建物名（カナ・任意）">
                <input type="text" value={line1Kana} onChange={e => setLine1Kana(e.target.value)}
                  placeholder="○○ビル101" className={inputClass} />
              </Field>
            </div>
          </FormSection>

          {/* ── ⑤ 事業内容 ── */}
          <FormSection title="事業内容" icon={<FileText className="w-5 h-5 text-orange-500" />}>
            <Field label="サービス内容の説明" required hint="10文字以上（例：飲食店での余剰食品のおすそ分け販売）">
              <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)}
                placeholder="例：飲食店での余剰食品を詰め合わせた「おすそ分け袋」の販売。フードロス削減を目的とした割引価格での提供。"
                rows={4} required minLength={10} className={`${inputClass} resize-none`} />
              <p className="text-xs text-gray-400 mt-1.5">{productDescription.length} 文字</p>
            </Field>
            <Field label="ウェブサイトURL（任意）" hint="店舗のSNSや公式サイト">
              <input type="url" value={businessUrl} onChange={e => setBusinessUrl(e.target.value)}
                placeholder="https://example.com" className={inputClass} />
            </Field>
          </FormSection>

          {/* ── ⑥ 銀行情報 ── */}
          <FormSection title="銀行情報" icon={<Building2 className="w-5 h-5 text-orange-500" />}>
            <Field label="銀行名">
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder="例：三菱UFJ銀行" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="銀行コード（4桁）" required>
                <input type="text" value={bankCode}
                  onChange={e => setBankCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0005" maxLength={4} inputMode="numeric" required
                  className={`${inputClass} font-mono tracking-widest`} />
              </Field>
              <Field label="支店コード（3桁）" required>
                <input type="text" value={branchCode}
                  onChange={e => setBranchCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="001" maxLength={3} inputMode="numeric" required
                  className={`${inputClass} font-mono tracking-widest`} />
              </Field>
            </div>
          </FormSection>

          {/* ── ⑦ 口座情報 ── */}
          <FormSection title="口座情報" icon={<CreditCard className="w-5 h-5 text-orange-500" />}>
            <Field label="口座番号" required>
              <input type="text" value={accountNumber}
                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="1234567" maxLength={8} inputMode="numeric" required
                className={`${inputClass} font-mono tracking-widest`} />
            </Field>
            <Field label="口座名義（カタカナ）" required hint="通帳に記載されているカタカナ表記でご入力ください">
              <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)}
                placeholder="タナカ タロウ" required className={inputClass} />
            </Field>
          </FormSection>

          {/* ── ToS ── */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <button type="button" role="checkbox" aria-checked={tosAgreed}
                onClick={() => handleTosChange(!tosAgreed)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  tosAgreed ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                }`}>
                {tosAgreed && <CheckCircle2 className="w-4 h-4 text-white" />}
              </button>
              <p className="text-sm text-gray-700 leading-relaxed">
                <a href="/terms" target="_blank" rel="noopener noreferrer"
                  className="text-orange-600 font-bold underline underline-offset-2"
                  onClick={e => e.stopPropagation()}>
                  タベロスの利用規約
                </a>
                および
                <a href="https://stripe.com/jp/connect-account/legal" target="_blank" rel="noopener noreferrer"
                  className="text-orange-600 font-bold underline underline-offset-2"
                  onClick={e => e.stopPropagation()}>
                  Stripe連結アカウント利用規約
                </a>
                に同意します
              </p>
            </label>
          </div>

          {/* エラー */}
          <AnimatePresence>
            {error && step === 'form' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 送信中ステップ表示 */}
          {loading && step === 'bank_done' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-700">銀行口座を登録しました</p>
                <p className="text-xs text-green-600">本人確認情報を送信中...</p>
              </div>
              <Loader2 className="w-4 h-4 text-green-500 animate-spin ml-auto" />
            </div>
          )}

          {/* 不足項目リスト（ボタンが押せない理由を表示） */}
          <AnimatePresence>
            {!canSubmit && !loading && missingFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4"
              >
                <p className="text-xs font-black text-amber-800 mb-2 flex items-center gap-1.5">
                  <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                  あと {missingFields.length} 項目を入力するとボタンが押せます
                </p>
                <ul className="space-y-1">
                  {missingFields.map(f => (
                    <li key={f} className="text-xs text-amber-700 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-amber-500 rounded-full shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 送信ボタン */}
          <button type="submit" disabled={!canSubmit}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity active:scale-[0.98]">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" />処理中...</>
              : <>登録して出品を始める</>
            }
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>情報はStripeのサーバーで安全に処理されます</span>
          </div>
        </form>
      </div>
    </div>
  );
}
