import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyStore } from '@/hooks/use-my-store';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, ChevronLeft, Loader2, CheckCircle2,
  AlertCircle, ShieldCheck, Info, CreditCard, PartyPopper,
  User, MapPin, FileText, TriangleAlert,
  Camera, ImageIcon, BadgeCheck,
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK ?? '');

// ── 画像圧縮（本人確認書類用 — Stripe送信前に軽量化）────────────────────────────
async function compressIdImage(dataUrl: string, maxPx = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else { width = Math.round(width * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── localStorage 下書き保存（ストアIDごとに分離）────────────────────────────────
// v2: storeId 単位のキーにすることで別ストアのデータが混入しないようにした
const DRAFT_KEY_PREFIX = 'bank-setup-draft-v2-';
const BUSINESS_TYPE_KEY = 'store-business-type';
function loadSavedBusinessType(): 'individual' | 'company' {
  try { const v = localStorage.getItem(BUSINESS_TYPE_KEY); return v === 'company' ? 'company' : 'individual'; } catch (_) { return 'individual'; }
}
type DraftState = {
  lastNameKanji: string; firstNameKanji: string;
  lastNameKana: string;  firstNameKana: string;
  phone: string; email: string;
  dobYear: string; dobMonth: string; dobDay: string;
  postalCode: string;
  stateKanji: string; cityKanji: string; townKanji: string; line1Kanji: string;
  stateKana: string;  cityKana: string;  townKana: string;  line1Kana: string;
  productDescription: string; businessUrl: string;
  bankName: string; bankCode: string; branchCode: string;
  accountNumber: string; holderName: string;
  companyNameKanji?: string; companyNameKana?: string;
  companyNameLatin?: string; companyTaxId?: string;
  representativeTitle?: string;
};
function draftKey(storeId: number) { return `${DRAFT_KEY_PREFIX}${storeId}`; }
function saveDraft(storeId: number, d: DraftState) {
  try { localStorage.setItem(draftKey(storeId), JSON.stringify(d)); } catch (_) {}
}
function loadDraft(storeId: number): Partial<DraftState> {
  // 旧 v1 キーを削除してクリーンアップ
  try { localStorage.removeItem('bank-setup-draft-v1'); } catch (_) {}
  try { const r = localStorage.getItem(draftKey(storeId)); return r ? JSON.parse(r) : {}; } catch (_) { return {}; }
}
function clearDraft(storeId: number) {
  try { localStorage.removeItem(draftKey(storeId)); } catch (_) {}
}

// ── 全角カタカナ → 半角カタカナ変換（Stripe JP 口座名義に必要）──────────────────
function toHalfWidthKana(str: string): string {
  const map: Record<string, string> = {
    'ア':'ｱ','イ':'ｲ','ウ':'ｳ','エ':'ｴ','オ':'ｵ',
    'カ':'ｶ','キ':'ｷ','ク':'ｸ','ケ':'ｹ','コ':'ｺ',
    'サ':'ｻ','シ':'ｼ','ス':'ｽ','セ':'ｾ','ソ':'ｿ',
    'タ':'ﾀ','チ':'ﾁ','ツ':'ﾂ','テ':'ﾃ','ト':'ﾄ',
    'ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ',
    'ハ':'ﾊ','ヒ':'ﾋ','フ':'ﾌ','ヘ':'ﾍ','ホ':'ﾎ',
    'マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ',
    'ヤ':'ﾔ','ユ':'ﾕ','ヨ':'ﾖ',
    'ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ',
    'ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ',
    'ガ':'ｶﾞ','ギ':'ｷﾞ','グ':'ｸﾞ','ゲ':'ｹﾞ','ゴ':'ｺﾞ',
    'ザ':'ｻﾞ','ジ':'ｼﾞ','ズ':'ｽﾞ','ゼ':'ｾﾞ','ゾ':'ｿﾞ',
    'ダ':'ﾀﾞ','ヂ':'ﾁﾞ','ヅ':'ﾂﾞ','デ':'ﾃﾞ','ド':'ﾄﾞ',
    'バ':'ﾊﾞ','ビ':'ﾋﾞ','ブ':'ﾌﾞ','ベ':'ﾍﾞ','ボ':'ﾎﾞ',
    'パ':'ﾊﾟ','ピ':'ﾋﾟ','プ':'ﾌﾟ','ペ':'ﾍﾟ','ポ':'ﾎﾟ',
    'ァ':'ｧ','ィ':'ｨ','ゥ':'ｩ','ェ':'ｪ','ォ':'ｫ',
    'ッ':'ｯ','ャ':'ｬ','ュ':'ｭ','ョ':'ｮ',
    'ー':'ｰ','・':'･','「':'｢','」':'｣','。':'｡','、':'､',
    '　':' ',
  };
  return str.split('').map(c => map[c] ?? c).join('');
}

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
  const [location, navigate] = useLocation();
  const { store, loading: loadingStore, fetchError, refetch } = useMyStore();
  const { session, refreshProfile } = useAuth();
  const notifiedRef = useRef(false);

  // ── URL パラム or localStorage から事業形態を復元 ──
  const urlType = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('type');
  // URLパラムが明示的に指定された場合のみ引き継ぐ。それ以外は常に個人事業主スタート
  const initialBusinessType: 'individual' | 'company' = urlType === 'company' ? 'company' : 'individual';

  // ── 銀行口座情報 ──（draft は store.id 確定後に useEffect で復元）
  const [bankName, setBankName]           = useState('');
  const [bankCode, setBankCode]           = useState('');
  const [branchCode, setBranchCode]       = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName]       = useState('');
  const [tosAgreed, setTosAgreed]         = useState(false);
  const [tosTime, setTosTime]             = useState<number | null>(null);

  // ── KYC: 事業形態 ──
  const [businessType, setBusinessType] = useState<'individual' | 'company'>(initialBusinessType);

  // ── KYC: 法人情報（法人の場合のみ） ──
  const [companyNameKanji, setCompanyNameKanji]         = useState('');
  const [companyNameKana, setCompanyNameKana]           = useState('');
  const [companyNameLatin, setCompanyNameLatin]         = useState('');
  const [companyTaxId, setCompanyTaxId]                 = useState('');
  const [companyStructure, setCompanyStructure]         = useState('');
  const [representativeTitle, setRepresentativeTitle]   = useState('代表取締役');

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

  // ── store.id が確定したら、そのストア専用ドラフトを読み込んで復元 ──
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (!store?.id || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const d = loadDraft(store.id);
    if (d.bankName)           setBankName(d.bankName);
    if (d.bankCode)           setBankCode(d.bankCode);
    if (d.branchCode)         setBranchCode(d.branchCode);
    if (d.accountNumber)      setAccountNumber(d.accountNumber);
    if (d.holderName)         setHolderName(d.holderName);
    if (d.companyNameKanji)   setCompanyNameKanji(d.companyNameKanji);
    if (d.companyNameKana)    setCompanyNameKana(d.companyNameKana);
    if (d.companyNameLatin)   setCompanyNameLatin(d.companyNameLatin);
    if (d.companyTaxId)       setCompanyTaxId(d.companyTaxId);
    if (d.representativeTitle) setRepresentativeTitle(d.representativeTitle);
    if (d.lastNameKanji)      setLastNameKanji(d.lastNameKanji);
    if (d.firstNameKanji)     setFirstNameKanji(d.firstNameKanji);
    if (d.lastNameKana)       setLastNameKana(d.lastNameKana);
    if (d.firstNameKana)      setFirstNameKana(d.firstNameKana);
    if (d.phone)              setPhone(d.phone);
    if (d.email)              setEmail(d.email);
    if (d.dobYear)            setDobYear(d.dobYear);
    if (d.dobMonth)           setDobMonth(d.dobMonth);
    if (d.dobDay)             setDobDay(d.dobDay);
    if (d.postalCode)         setPostalCode(d.postalCode);
    if (d.stateKanji)         setStateKanji(d.stateKanji);
    if (d.cityKanji)          setCityKanji(d.cityKanji);
    if (d.townKanji)          setTownKanji(d.townKanji);
    if (d.line1Kanji)         setLine1Kanji(d.line1Kanji);
    if (d.stateKana)          setStateKana(d.stateKana);
    if (d.cityKana)           setCityKana(d.cityKana);
    if (d.townKana)           setTownKana(d.townKana);
    if (d.line1Kana)          setLine1Kana(d.line1Kana);
    if (d.productDescription) setProductDescription(d.productDescription);
    if (d.businessUrl)        setBusinessUrl(d.businessUrl);
  }, [store?.id]);

  // ── 本人確認書類 ──
  const [docFrontFile, setDocFrontFile]       = useState<File | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string | null>(null);
  const [docBackFile, setDocBackFile]         = useState<File | null>(null);
  const [docBackPreview, setDocBackPreview]   = useState<string | null>(null);
  const [docError, setDocError]               = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef  = useRef<HTMLInputElement>(null);

  // ── 営業許可証 ──
  const [bizLicenseFile, setBizLicenseFile]       = useState<File | null>(null);
  const [bizLicensePreview, setBizLicensePreview] = useState<string | null>(null);
  const [bizLicenseNumber, setBizLicenseNumber]   = useState('');
  const bizLicenseInputRef = useRef<HTMLInputElement>(null);

  // ── UI 状態 ──
  const [loading, setLoading]           = useState(false);
  const [zipLoading, setZipLoading]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  // ── 下書き自動保存（30秒ごと + state変化から2秒後）──
  const draftStateRef = useRef<DraftState>({
    lastNameKanji, firstNameKanji, lastNameKana, firstNameKana,
    phone, email, dobYear, dobMonth, dobDay,
    postalCode, stateKanji, cityKanji, townKanji, line1Kanji,
    stateKana, cityKana, townKana, line1Kana,
    productDescription, businessUrl,
    bankName, bankCode, branchCode, accountNumber, holderName,
    companyNameKanji, companyNameKana, companyNameLatin, companyTaxId, representativeTitle,
  });
  useEffect(() => {
    draftStateRef.current = {
      lastNameKanji, firstNameKanji, lastNameKana, firstNameKana,
      phone, email, dobYear, dobMonth, dobDay,
      postalCode, stateKanji, cityKanji, townKanji, line1Kanji,
      stateKana, cityKana, townKana, line1Kana,
      productDescription, businessUrl,
      bankName, bankCode, branchCode, accountNumber, holderName,
      companyNameKanji, companyNameKana, companyNameLatin, companyTaxId, representativeTitle,
    };
    if (store?.id) {
      const t = setTimeout(() => saveDraft(store.id, draftStateRef.current), 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [store?.id, lastNameKanji, firstNameKanji, lastNameKana, firstNameKana,
      phone, email, dobYear, dobMonth, dobDay,
      postalCode, stateKanji, cityKanji, townKanji, line1Kanji,
      stateKana, cityKana, townKana, line1Kana,
      productDescription, businessUrl,
      bankName, bankCode, branchCode, accountNumber, holderName,
      companyNameKanji, companyNameKana, companyNameLatin, companyTaxId, representativeTitle]);

  // 30秒おきにも保存
  useEffect(() => {
    const interval = setInterval(() => {
      if (store?.id) saveDraft(store.id, draftStateRef.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, [store?.id]);

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

  const handleDocFileChange = (side: 'front' | 'back') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocError(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      // クライアント側で圧縮（Stripe 送信前に軽量化）
      const compressed = await compressIdImage(raw);
      if (side === 'front') { setDocFrontFile(file); setDocFrontPreview(compressed); }
      else                  { setDocBackFile(file);  setDocBackPreview(compressed);  }
    };
    reader.readAsDataURL(file);
  };

  const handleBizLicenseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      const compressed = await compressIdImage(raw);
      setBizLicenseFile(file);
      setBizLicensePreview(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleTosChange = (checked: boolean) => {
    setTosAgreed(checked);
    setTosTime(checked ? Date.now() : null);
  };

  // ── バリデーション：不足項目リスト ──
  const missingFields: string[] = [];
  if (businessType === 'company' && !companyNameKanji.trim()) missingFields.push('法人名（漢字）');
  if (businessType === 'company' && !companyNameKana.trim())  missingFields.push('法人名（カナ）');
  if (businessType === 'company' && !companyNameLatin.trim()) missingFields.push('法人名（ローマ字）— Stripe必須');
  if (businessType === 'company' && companyTaxId.replace(/-/g, '').length !== 13) missingFields.push(`法人番号（13桁で入力 — 現在${companyTaxId.replace(/-/g, '').length}桁）`);
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
  if (!bankName.trim())                                 missingFields.push('銀行名');
  if (bankCode.length !== 4)                            missingFields.push(`銀行コード（${bankCode.length}桁 → 4桁で入力）`);
  if (branchCode.length !== 3)                          missingFields.push(`支店コード（${branchCode.length}桁 → 3桁で入力）`);
  if (!accountNumber.trim())                            missingFields.push('口座番号');
  if (!holderName.trim())                               missingFields.push('口座名義（カタカナ）');
  if (!docFrontPreview)                                 missingFields.push('本人確認書類（表面）の写真');
  if (!docBackPreview)                                  missingFields.push('本人確認書類（裏面）の写真');
  if (!bizLicensePreview)                               missingFields.push('営業許可証の画像');
  if (!bizLicenseNumber.trim())                         missingFields.push('営業許可証番号');
  if (!tosAgreed)                                       missingFields.push('利用規約への同意');

  const canSubmit = !loading && missingFields.length === 0;

  // ── 送信 ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !tosAgreed || !tosTime || !canSubmit) return;

    setLoading(true);
    setError(null);
    setSubmitStatus('口座情報を検証中...');

    // 90秒タイムアウト用 AbortController
    const controller = new AbortController();
    abortRef.current = controller;
    // APIが早期にレスポンスを返すので30秒で十分
    const timeoutId = setTimeout(() => {
      console.log('[StripeBankSetup] ⏱ 30秒タイムアウト — 処理中としてマイページへ遷移');
      controller.abort();
    }, 30_000);

    try {
      // ① Stripe.js で銀行口座トークン生成
      setSubmitStatus('Stripe に接続中...');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripeの読み込みに失敗しました。ページを再読み込みしてください。');

      const routingNumber = bankCode.trim().padStart(4, '0') + branchCode.trim().padStart(3, '0');
      // Stripe JP は半角カタカナを要求するため自動変換
      const holderNameHalf = toHalfWidthKana(holderName.trim());
      console.log('[StripeBankSetup] createToken params:', { routingNumber, accountNumber: accountNumber.trim(), holderNameHalf });
      const result = await (stripe as any).createToken('bank_account', {
        country: 'JP', currency: 'jpy',
        routing_number: routingNumber,
        account_number: accountNumber.trim(),
        account_holder_name: holderNameHalf,
        account_holder_type: 'individual',
      });

      if (result.error) {
        setError(result.error.message ?? '口座情報が正しくありません。入力内容をご確認ください。');
        return;
      }

      // ② 全データを一括送信（口座登録 + KYC + 書類アップロード + DB approved 更新）
      setSubmitStatus('登録情報をサーバーに送信中...');
      console.log(`[StripeBankSetup] POST /api/stores/${store.id}/connect/bank-setup 開始`);

      const res = await fetch(`/api/stores/${store.id}/connect/bank-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          bankToken:    result.token.id,
          tosTimestamp: tosTime,
          businessType,
          kycData: {
            firstNameKanji: firstNameKanji.trim(),
            lastNameKanji:  lastNameKanji.trim(),
            firstNameKana:  firstNameKana.trim(),
            lastNameKana:   lastNameKana.trim(),
            phone:          phone.trim(),
            email:          email.trim() || undefined,
            dobYear:        parseInt(dobYear),
            dobMonth:       parseInt(dobMonth),
            dobDay:         parseInt(dobDay),
            postalCode,
            stateKanji, cityKanji: cityKanji.trim(), townKanji: townKanji.trim(),
            line1Kanji: line1Kanji.trim() || undefined,
            stateKana,  cityKana:  cityKana.trim(),  townKana:  townKana.trim(),
            line1Kana:  line1Kana.trim() || undefined,
            productDescription: productDescription.trim() || undefined,
            businessUrl:        businessUrl.trim() || undefined,
            ...(businessType === 'company' ? {
              companyNameKanji:     companyNameKanji.trim()              || undefined,
              companyNameKana:      companyNameKana.trim()               || undefined,
              companyNameLatin:     companyNameLatin.trim()              || undefined,
              companyTaxId:         companyTaxId.replace(/-/g, '').trim() || undefined,
              companyStructure:     companyStructure                     || undefined,
              representativeTitle:  representativeTitle.trim()           || '代表取締役',
            } : {}),
          },
          // 本人確認書類（base64 data URL のまま送信）
          docFrontBase64: docFrontPreview,
          docFrontMime:   docFrontFile?.type ?? 'image/jpeg',
          docBackBase64:  docBackPreview ?? undefined,
          docBackMime:    docBackFile?.type ?? undefined,
          // 営業許可証
          bizLicenseBase64:   bizLicensePreview ?? undefined,
          bizLicenseMime:     bizLicenseFile?.type ?? undefined,
          bizLicenseNumber:   bizLicenseNumber.trim() || undefined,
        }),
      });
      clearTimeout(timeoutId);

      console.log(`[StripeBankSetup] レスポンス受信: status=${res.status}`);
      const data = await res.json();
      if (!res.ok) {
        const hint = data.param ? `（項目: ${data.param}）` : '';
        setError(`${data.message ?? '登録に失敗しました。'}${hint}`);
        return;
      }

      // ③ 完了 → 下書き削除・プロフィール更新・マイページへ
      setSubmitStatus('登録完了！');
      console.log('[StripeBankSetup] ✅ 登録成功 → /mypage へ遷移');
      if (store?.id) clearDraft(store.id);
      try { await refreshProfile(); } catch (_) {}
      try { await refetch(); } catch (_) {}
      navigate('/mypage');
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        // タイムアウト → ステータスは applied 更新済みなのでマイページへ
        console.log('[StripeBankSetup] AbortError (タイムアウト) → /mypage へ遷移');
        setSubmitStatus('処理完了！');
        if (store?.id) clearDraft(store.id);
        try { await refreshProfile(); } catch (_) {}
        try { await refetch(); } catch (_) {}
        navigate('/mypage');
        return;
      }
      // エラー → 画面はそのまま、エラーメッセージ表示（入力内容は保持）
      console.error('[StripeBankSetup] エラー:', err);
      setError(err?.message ?? '予期しないエラーが発生しました。');
    } finally {
      setLoading(false);
      setSubmitStatus('');
      abortRef.current = null;
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

  // ────────── 店舗なし（取得エラー or 未登録）──────────
  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
          <p className="font-black text-gray-900 mb-1">
            {fetchError ? '読み込みに失敗しました' : '店舗が見つかりません'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {fetchError
              ? 'ネットワーク状況を確認して、再度お試しください。'
              : '先に店舗申請を完了してください。'}
          </p>
          {fetchError ? (
            <button onClick={refetch}
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl w-full mb-3">
              再読み込み
            </button>
          ) : null}
          <button onClick={() => navigate('/store-onboarding')}
            className={`font-bold px-6 py-3 rounded-2xl w-full ${fetchError ? 'bg-white text-orange-500 border-2 border-orange-300' : 'bg-orange-500 text-white'}`}>
            店舗申請へ
          </button>
        </div>
      </div>
    );
  }

  // ────────── 口座登録済み（Stripeアカウント連携済み、または申請中）──────────
  // 通過（フォームを表示）する条件:
  //   - status === 'rejected'（再設定のため通過）
  //   - stripeAccountId が null（STEP1 が失敗したまま、またはまだ未登録）
  //   - stripeChargesEnabled === false（Stripe 情報が不完全 → 再送信が必要）
  const stripeIncomplete = !!store.stripeAccountId && store.stripeChargesEnabled === false;
  const noStripeAccount  = !store.stripeAccountId;
  if (
    store.status !== 'rejected' &&
    !noStripeAccount &&
    !stripeIncomplete
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            {store.stripeAccountId ? '口座登録が完了しています' : '申請を受け付けました'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {store.stripeAccountId
              ? '口座・本人確認情報の登録が完了しています。'
              : '口座・本人確認情報の申請を受け付けました。\nStripeの審査はバックグラウンドで進行中です。'}
          </p>
          <button onClick={() => navigate('/mypage')}
            className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl w-full">
            マイページへ
          </button>
        </div>
      </div>
    );
  }

  // ────────── Stripe 情報不完全（chargesEnabled=false）── 再送信バナーを表示 ──
  const incompleteWarning = stripeIncomplete ? (
    <div className="mx-4 mt-4 mb-0 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
      <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
      <div>
        <p className="text-sm font-bold text-amber-800">Stripe 情報が不完全です</p>
        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
          前回の登録で一部の情報が送信されませんでした。フォームを再入力して再送信してください。
        </p>
      </div>
    </div>
  ) : null;

  // ────────── 完了後：成功画面 ──────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm w-full"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">登録完了！</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            口座情報・本人確認書類・代表者情報をすべてStripeへ送信しました。
          </p>
          <p className="text-xs text-gray-400 leading-relaxed mb-8">
            Stripeの審査はバックグラウンドで進行します。審査が通過次第、出品の売上を受け取れるようになります。
          </p>
          <button
            onClick={() => navigate('/mypage')}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-base rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
          >
            マイページへ
          </button>
        </motion.div>
      </div>
    );
  }

  // ────────── メインフォーム ──────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-lg mx-auto px-4 pt-safe-or-4 pb-12">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 py-5">
          <button onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">口座登録 & 本人確認</h1>
            <p className="text-xs text-gray-500">売上受取口座と本人確認情報を設定します</p>
          </div>
        </div>

        {/* トップバナー：却下時は赤い却下理由バナー、通常時は審査通過バナー */}
        {store.status === 'rejected' ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
            className="rounded-2xl mb-5 border border-red-200 bg-red-50 overflow-hidden"
          >
            <div className="bg-red-500 px-5 py-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
              <p className="text-white font-black text-sm">申請が却下されました — 修正が必要です</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-black text-red-600 mb-1.5">却下理由</p>
              <p className="text-sm text-red-700 leading-relaxed">
                {store.rejectionReason ?? '口座情報または本人確認情報に不備があります。下記フォームで修正して再申請してください。'}
              </p>
              <p className="text-xs text-red-400 mt-3 leading-relaxed">
                下記フォームで<strong className="text-red-500">Stripe口座情報を再入力</strong>して送信してください。送信後、管理者が再審査します。
              </p>
            </div>
          </motion.div>
        ) : (
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
                おめでとうございます🎊 以下の情報を登録して、<strong className="text-white">おすそわけ袋の出品</strong>を始めましょう。
              </p>
            </div>
          </motion.div>
        )}

        {/* セキュリティ説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            口座・本人確認情報はStripeのセキュアなサーバーで直接処理されます。Osusowakeのサーバーには口座番号は一切保存されません。
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Stripe 不完全バナー（chargesEnabled=false の再送信時） */}
          {incompleteWarning}

          {/* ── ① 事業形態 ── */}
          <FormSection title="事業形態" icon={<Building2 className="w-5 h-5 text-orange-500" />}>
            <div className="grid grid-cols-2 gap-3">
              {([
                { t: 'individual' as const, emoji: '👤', label: '個人事業主' },
                { t: 'company'    as const, emoji: '🏢', label: '法人' },
              ]).map(({ t, emoji, label }) => (
                <button key={t} type="button"
                  onClick={() => {
                    setBusinessType(t);
                    try { localStorage.setItem('store-business-type', t); } catch (_) {}
                  }}
                  className={`relative py-3 px-2 rounded-xl font-bold text-sm border-2 transition-all flex flex-col items-center gap-0.5 ${
                    businessType === t ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500'
                  }`}>
                  {businessType === t && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2 h-2 fill-none stroke-white stroke-[1.8]"><polyline points="2,5.5 4.2,7.5 8,3" /></svg>
                    </span>
                  )}
                  <span className="text-lg">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {businessType === 'individual'
                ? '個人事業主として Stripe に登録されます。マイナンバー等の個人情報が必要です。'
                : '法人として Stripe に登録されます。法人名（登記簿上の名称）と代表者情報が必要です。'}
            </p>
          </FormSection>

          {/* ── ①-b 法人情報（法人のみ表示）── */}
          {businessType === 'company' && (
            <FormSection title="法人情報" icon={<Building2 className="w-5 h-5 text-orange-500" />}>
              <Field label="法人名（漢字・登記簿上の名称）" required hint="例：株式会社〇〇フード">
                <input type="text" value={companyNameKanji} onChange={e => setCompanyNameKanji(e.target.value)}
                  placeholder="株式会社〇〇フード" required={businessType === 'company'} className={inputClass} />
              </Field>
              <Field label="法人名（カナ）" required hint="全角カタカナ（例：カブシキガイシャ〇〇フード）">
                <input type="text" value={companyNameKana} onChange={e => setCompanyNameKana(e.target.value)}
                  placeholder="カブシキガイシャ〇〇フード" required={businessType === 'company'} className={inputClass} />
              </Field>
              <Field label="法人名（ローマ字・英語）" required hint="Stripeの必須項目。例：Kabushiki Gaisha XX Food">
                <input type="text" value={companyNameLatin} onChange={e => setCompanyNameLatin(e.target.value)}
                  placeholder="Kabushiki Gaisha XX Food" required={businessType === 'company'} className={inputClass} />
              </Field>
              <Field label="法人番号（13桁）" required hint="国税庁の法人番号。ハイフンなしで入力">
                <input type="text" value={companyTaxId} onChange={e => setCompanyTaxId(e.target.value.replace(/[^\d-]/g, ''))}
                  placeholder="0000000000000" maxLength={13} inputMode="numeric" className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">{companyTaxId.replace(/-/g, '').length} / 13 桁</p>
              </Field>
            </FormSection>
          )}

          {/* ── ② 代表者氏名 ── */}
          <FormSection title={businessType === 'company' ? '代表者（法人代表）の氏名' : '代表者氏名'} icon={<User className="w-5 h-5 text-orange-500" />}>
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
            {businessType === 'company' && (
              <Field label="代表者の役職" required hint="例：代表取締役、CEO">
                <input type="text" value={representativeTitle} onChange={e => setRepresentativeTitle(e.target.value)}
                  placeholder="代表取締役" className={inputClass} />
              </Field>
            )}
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
          <FormSection title={businessType === 'company' ? '代表者（法人代表）の住所' : '代表者（本人）の住所'} icon={<MapPin className="w-5 h-5 text-orange-500" />}>
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
            <Field label="サービス内容の説明" required hint="10文字以上（例：飲食店での余剰食品のおすそわけ販売）">
              <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)}
                placeholder="例：飲食店での余剰食品を詰め合わせた「おすそわけ袋」の販売。フードロス削減を目的とした割引価格での提供。"
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
            <Field label="銀行名" required>
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder="例：三菱UFJ銀行" required className={inputClass} />
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
                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="1234567" maxLength={7} inputMode="numeric" required
                className={`${inputClass} font-mono tracking-widest`} />
            </Field>
            <Field label="口座名義（カタカナ）" required hint="通帳に記載されているカタカナ表記で入力してください（全角・半角どちらでも可）">
              <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)}
                placeholder="サトウ タロウ" required className={inputClass} />
            </Field>
          </FormSection>

          {/* ── ⑧ 本人確認書類 ── */}
          <FormSection title={businessType === 'company' ? '代表者の本人確認書類' : '本人確認書類'} icon={<BadgeCheck className="w-5 h-5 text-orange-500" />}>
            <p className="text-sm text-gray-500 -mt-1 mb-3">
              {businessType === 'company'
                ? '代表者（法人代表）の運転免許証・マイナンバーカード・パスポートなど。'
                : '運転免許証・マイナンバーカード・パスポートなど。'}
              <span className="text-red-500 font-medium">表面・裏面ともに必須</span>です。
            </p>
            {/* hidden inputs */}
            <input ref={frontInputRef} type="file" accept="image/*,image/heic,image/heif" className="hidden"
              onChange={handleDocFileChange('front')} />
            <input ref={backInputRef}  type="file" accept="image/*,image/heic,image/heif" className="hidden"
              onChange={handleDocFileChange('back')}  />

            <div className="grid grid-cols-2 gap-3">
              {/* 表面 */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-600">表面 <span className="text-red-500">*</span></p>
                <button type="button" onClick={() => frontInputRef.current?.click()}
                  className={`relative w-full aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 overflow-hidden transition-colors ${
                    docFrontPreview ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:border-orange-300'
                  }`}>
                  {docFrontPreview ? (
                    <>
                      <img src={docFrontPreview} alt="表面プレビュー" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                        <Camera className="w-6 h-6 text-white opacity-80" />
                        <span className="text-xs text-white font-medium">タップして変更</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">タップして選択</span>
                    </>
                  )}
                </button>
              </div>

              {/* 裏面 */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-600">裏面 <span className="text-red-500">*</span></p>
                <button type="button" onClick={() => backInputRef.current?.click()}
                  className={`relative w-full aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 overflow-hidden transition-colors ${
                    docBackPreview ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-gray-50 hover:border-orange-300'
                  }`}>
                  {docBackPreview ? (
                    <>
                      <img src={docBackPreview} alt="裏面プレビュー" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                        <Camera className="w-6 h-6 text-white opacity-80" />
                        <span className="text-xs text-white font-medium">タップして変更</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">タップして選択</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {docError && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {docError}
              </p>
            )}
          </FormSection>

          {/* ── ⑨ 営業許可証 ── */}
          <FormSection title="営業許可証" icon={<FileText className="w-5 h-5 text-orange-500" />}>
            <p className="text-sm text-gray-500 -mt-1 mb-3">
              食品衛生法に基づく営業許可証の画像をアップロードしてください。
              <span className="text-red-500 font-medium ml-1">必須</span>
            </p>

            <input
              ref={bizLicenseInputRef}
              type="file"
              accept="image/*,image/heic,image/heif,application/pdf"
              className="hidden"
              onChange={handleBizLicenseChange}
            />

            <button
              type="button"
              onClick={() => bizLicenseInputRef.current?.click()}
              className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden transition-colors ${
                bizLicensePreview
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-red-300 bg-red-50/40 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {bizLicensePreview ? (
                <>
                  <img src={bizLicensePreview} alt="営業許可証プレビュー" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                    <Camera className="w-7 h-7 text-white opacity-80" />
                    <span className="text-sm text-white font-bold">タップして変更</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">タップして書類を追加</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG・PNG・HEIC・PDF 対応</p>
                  </div>
                </>
              )}
            </button>

            {!bizLicensePreview && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                営業許可証は必須です。書類の画像を添付してください。
              </p>
            )}

            {/* 許可証番号 */}
            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                営業許可証番号 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={bizLicenseNumber}
                onChange={e => setBizLicenseNumber(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 outline-none transition-all"
                placeholder="例: 第○○号"
              />
              <p className="text-xs text-gray-400 mt-1.5">許可証に記載の番号を入力してください（必須）</p>
            </div>
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
                  Osusowakeの利用規約
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
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 送信中インジケーター */}
          {loading && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-orange-500 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-700">
                  {submitStatus || '店舗情報の最終設定中です...'}
                </p>
                <p className="text-xs text-orange-600">通常10秒ほどで完了します</p>
              </div>
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
