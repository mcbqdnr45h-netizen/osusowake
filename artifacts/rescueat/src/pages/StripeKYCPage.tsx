import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  ShieldCheck, User, Building2, MapPin, FileText,
  TriangleAlert, Info, ClipboardCheck,
} from 'lucide-react';

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

// ── 要件ラベルを日本語化 ──────────────────────────────────────────
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
    'individual.address_kana.postal_code': 'カナ住所（郵便番号）',
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

// ── FormSection ──────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="font-black text-gray-900 text-base flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

const inputClass =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors';
const selectClass =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-orange-400 focus:outline-none transition-colors bg-white';

// ────────────────────────────────────────────────────────────────────────────
export default function StripeKYCPage() {
  const [, navigate] = useLocation();
  const { store, loading: loadingStore } = useMyStore();
  const { session } = useAuth();

  // ── 事業形態 ──
  const [businessType, setBusinessType] = useState<'individual' | 'company'>('individual');

  // ── 代表者氏名 ──
  const [lastNameKanji, setLastNameKanji]   = useState('');
  const [firstNameKanji, setFirstNameKanji] = useState('');
  const [lastNameKana, setLastNameKana]     = useState('');
  const [firstNameKana, setFirstNameKana]   = useState('');

  // ── 生年月日 ──
  const [dobYear, setDobYear]   = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay]     = useState('');

  // ── 住所（漢字） ──
  const [postalCode, setPostalCode]     = useState('');
  const [stateKanji, setStateKanji]     = useState('');
  const [cityKanji, setCityKanji]       = useState('');
  const [townKanji, setTownKanji]       = useState('');
  const [line1Kanji, setLine1Kanji]     = useState('');

  // ── 住所（カナ） ──
  const [stateKana, setStateKana]   = useState('');
  const [cityKana, setCityKana]     = useState('');
  const [townKana, setTownKana]     = useState('');
  const [line1Kana, setLine1Kana]   = useState('');

  // ── 事業内容 ──
  const [productDescription, setProductDescription] = useState('');
  const [businessUrl, setBusinessUrl]               = useState('');

  // ── UI状態 ──
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

  type RequirementsResult = {
    currentlyDue: string[];
    eventuallyDue: string[];
    errors: { code: string; reason: string; requirement: string }[];
    pendingVerification: string[];
    disabledReason: string | null;
  };
  const [result, setResult] = useState<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirements: RequirementsResult;
  } | null>(null);

  // ── 都道府県選択時にカナを自動セット ──
  const handlePrefectureChange = (idx: string) => {
    const i = parseInt(idx);
    if (isNaN(i)) return;
    setStateKanji(PREFECTURES_KANJI[i] ?? '');
    setStateKana(PREFECTURES_KANA[i] ?? '');
  };

  // ── 郵便番号→住所自動補完 ──
  const lookupZip = useCallback(async (zip: string) => {
    const clean = zip.replace(/[^0-9]/g, '');
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
        // カナはカタカナ変換
        setCityKana(addr.kana2 ?? '');
        setTownKana(addr.kana3 ?? '');
      }
    } catch (_) {
      // 失敗しても手入力に切り替えるだけ
    } finally {
      setZipLoading(false);
    }
  }, []);

  const handlePostalCodeChange = (v: string) => {
    const clean = v.replace(/[^0-9]/g, '').slice(0, 7);
    setPostalCode(clean);
    if (clean.length === 7) lookupZip(clean);
  };

  // ── 送信 ──
  const canSubmit =
    !loading &&
    lastNameKanji.trim() && firstNameKanji.trim() &&
    lastNameKana.trim() && firstNameKana.trim() &&
    dobYear && dobMonth && dobDay &&
    postalCode.length === 7 &&
    stateKanji && cityKanji && townKanji &&
    stateKana && cityKana && townKana &&
    productDescription.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/stores/${store.id}/connect/kyc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          businessType,
          representative: {
            firstNameKanji: firstNameKanji.trim(),
            lastNameKanji: lastNameKanji.trim(),
            firstNameKana: firstNameKana.trim(),
            lastNameKana: lastNameKana.trim(),
            dobYear: parseInt(dobYear),
            dobMonth: parseInt(dobMonth),
            dobDay: parseInt(dobDay),
            postalCode,
            stateKanji,
            cityKanji: cityKanji.trim(),
            townKanji: townKanji.trim(),
            line1Kanji: line1Kanji.trim() || undefined,
            stateKana,
            cityKana: cityKana.trim(),
            townKana: townKana.trim(),
            line1Kana: line1Kana.trim() || undefined,
          },
          businessProfile: {
            productDescription: productDescription.trim() || undefined,
            url: businessUrl.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? '送信に失敗しました。入力内容をご確認ください。');
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // ── ローディング ──
  if (loadingStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  // ── 送信完了後：結果画面 ──
  if (result) {
    const remaining = [
      ...result.requirements.currentlyDue,
      ...result.requirements.eventuallyDue,
    ].filter((v, i, a) => a.indexOf(v) === i);
    const allClear = remaining.length === 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">
          <div className="flex items-center gap-3 py-5">
            <button
              onClick={() => navigate('/mypage')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">KYC情報の送信結果</h1>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              {allClear ? '審査情報の送信が完了しました！' : '情報を送信しました'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {allClear
                ? 'Stripeへの情報送信が完了し、不足項目がなくなりました。審査通過まで少々お待ちください。'
                : '不足している情報がまだあります。下記をご確認ください。'
              }
            </p>

            {/* chargesEnabled / payoutsEnabled バッジ */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                result.chargesEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {result.chargesEnabled ? '✅ 支払い受取：有効' : '⏳ 支払い受取：審査中'}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                result.payoutsEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {result.payoutsEnabled ? '✅ 振込：有効' : '⏳ 振込：審査中'}
              </span>
            </div>
          </motion.div>

          {/* 残り要件 */}
          {remaining.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
              <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 text-amber-500" />
                まだ不足している情報（{remaining.length}件）
              </h3>
              <ul className="space-y-2">
                {remaining.map(req => (
                  <li key={req} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 shrink-0" />
                    <span className="text-gray-700">{translateRequirement(req)}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setResult(null)}
                className="mt-4 w-full py-2.5 border-2 border-orange-400 text-orange-500 font-bold text-sm rounded-xl"
              >
                フォームに戻って追記する
              </button>
            </div>
          )}

          {/* エラー詳細 */}
          {result.requirements.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
              <h3 className="font-black text-red-700 text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Stripeからのエラー
              </h3>
              <ul className="space-y-2">
                {result.requirements.errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-600">
                    <span className="font-bold">{translateRequirement(err.requirement)}</span>
                    {' — '}{err.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 審査中の項目 */}
          {result.requirements.pendingVerification.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
              <h3 className="font-black text-blue-700 text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Stripeが審査中の項目
              </h3>
              <ul className="space-y-1.5">
                {result.requirements.pendingVerification.map(req => (
                  <li key={req} className="text-sm text-blue-600">・{translateRequirement(req)}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => navigate('/mypage')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg"
          >
            マイページへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">

        {/* ── ヘッダー ── */}
        <div className="flex items-center gap-3 py-5">
          <button
            onClick={() => navigate('/mypage')}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">本人確認情報（KYC）</h1>
            <p className="text-xs text-gray-500">Stripeの審査に必要な情報を入力してください</p>
          </div>
        </div>

        {/* ── 説明バナー ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            「制限あり」を解除するために、決済プロバイダーStripeが代表者情報の確認を求めています。
            入力した情報はStripeのサーバーに安全に送信されます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── ① 事業形態 ── */}
          <Section title="事業形態" icon={<Building2 className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-2 gap-3">
              {(['individual', 'company'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBusinessType(t)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    businessType === t
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {t === 'individual' ? '👤 個人事業主' : '🏢 法人'}
                </button>
              ))}
            </div>
            {businessType === 'company' && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                法人の場合は代表者情報を入力してください。会社名として「姓＋名」が登録されます。
              </p>
            )}
          </Section>

          {/* ── ② 代表者氏名 ── */}
          <Section title="代表者氏名" icon={<User className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓（漢字）" required>
                <input
                  type="text"
                  value={lastNameKanji}
                  onChange={e => setLastNameKanji(e.target.value)}
                  placeholder="山田"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="名（漢字）" required>
                <input
                  type="text"
                  value={firstNameKanji}
                  onChange={e => setFirstNameKanji(e.target.value)}
                  placeholder="太郎"
                  required
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="姓（カナ）" required hint="全角カタカナ">
                <input
                  type="text"
                  value={lastNameKana}
                  onChange={e => setLastNameKana(e.target.value)}
                  placeholder="ヤマダ"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="名（カナ）" required hint="全角カタカナ">
                <input
                  type="text"
                  value={firstNameKana}
                  onChange={e => setFirstNameKana(e.target.value)}
                  placeholder="タロウ"
                  required
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* ── ③ 生年月日 ── */}
          <Section title="生年月日" icon={<User className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-3 gap-3">
              <Field label="年" required>
                <input
                  type="number"
                  value={dobYear}
                  onChange={e => setDobYear(e.target.value)}
                  placeholder="1985"
                  min={1920}
                  max={new Date().getFullYear() - 18}
                  required
                  inputMode="numeric"
                  className={inputClass}
                />
              </Field>
              <Field label="月" required>
                <select
                  value={dobMonth}
                  onChange={e => setDobMonth(e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </Field>
              <Field label="日" required>
                <select
                  value={dobDay}
                  onChange={e => setDobDay(e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}日</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ── ④ 住所（漢字） ── */}
          <Section title="住所" icon={<MapPin className="w-5 h-5 text-orange-500" />}>
            <Field label="郵便番号（ハイフンなし7桁）" required>
              <div className="relative">
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => handlePostalCodeChange(e.target.value)}
                  placeholder="5300001"
                  maxLength={7}
                  inputMode="numeric"
                  required
                  className={inputClass}
                />
                {zipLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">7桁入力で住所を自動補完します</p>
            </Field>

            <Field label="都道府県" required>
              <select
                value={PREFECTURES_KANJI.indexOf(stateKanji).toString()}
                onChange={e => handlePrefectureChange(e.target.value)}
                required
                className={selectClass}
              >
                <option value="-1">選択してください</option>
                {PREFECTURES_KANJI.map((p, i) => (
                  <option key={p} value={i}>{p}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="市区町村（漢字）" required>
                <input
                  type="text"
                  value={cityKanji}
                  onChange={e => setCityKanji(e.target.value)}
                  placeholder="大阪市北区"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="町名・番地（漢字）" required>
                <input
                  type="text"
                  value={townKanji}
                  onChange={e => setTownKanji(e.target.value)}
                  placeholder="梅田1-1"
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="建物名・部屋番号（任意）">
              <input
                type="text"
                value={line1Kanji}
                onChange={e => setLine1Kanji(e.target.value)}
                placeholder="○○ビル 101号室"
                className={inputClass}
              />
            </Field>

            {/* カナ住所 */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">住所（カタカナ）</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="市区町村（カナ）" required>
                  <input
                    type="text"
                    value={cityKana}
                    onChange={e => setCityKana(e.target.value)}
                    placeholder="オオサカシキタク"
                    required
                    className={inputClass}
                  />
                </Field>
                <Field label="町名・番地（カナ）" required>
                  <input
                    type="text"
                    value={townKana}
                    onChange={e => setTownKana(e.target.value)}
                    placeholder="ウメダ1-1"
                    required
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="建物名（カナ・任意）">
                <input
                  type="text"
                  value={line1Kana}
                  onChange={e => setLine1Kana(e.target.value)}
                  placeholder="○○ビル 101"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          {/* ── ⑤ 事業内容 ── */}
          <Section title="事業内容" icon={<FileText className="w-5 h-5 text-orange-500" />}>
            <Field label="事業内容の説明" required hint="10文字以上で具体的に入力してください（例：飲食店での余剰食品のおすそ分け販売）">
              <textarea
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
                placeholder="例：飲食店での余剰食品を詰め合わせた「おすそ分け袋」の販売サービス。フードロス削減を目的とした割引価格での提供。"
                rows={4}
                required
                minLength={10}
                className={`${inputClass} resize-none`}
              />
              <p className="text-xs text-gray-400 mt-1.5">{productDescription.length} 文字</p>
            </Field>

            <Field label="ウェブサイトURL（任意）" hint="店舗のSNSや公式サイトがあれば入力">
              <input
                type="url"
                value={businessUrl}
                onChange={e => setBusinessUrl(e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </Field>
          </Section>

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
              <><Loader2 className="w-5 h-5 animate-spin" />Stripeに送信中...</>
            ) : (
              <>KYC情報をStripeに送信する</>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>情報はStripeのサーバーに安全に送信されます</span>
          </div>
        </form>
      </div>
    </div>
  );
}
