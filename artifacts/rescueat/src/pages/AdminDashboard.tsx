import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, TrendingUp, Users, Store, Clock, CheckCircle, XCircle,
  Pause, Send, Megaphone, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  BadgeDollarSign, BarChart2, Bell, Settings, ToggleLeft, ToggleRight, Type, Wrench, CreditCard,
  LogOut, ExternalLink, Package, Receipt, Flag, MapPin, Trash2,
} from 'lucide-react';
import { fetchAppSettings } from '@/hooks/use-app-settings';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';

const STRIPE_FIELD_JA: Record<string, string> = {
  'individual.first_name_kana':          '代表者の名前（カナ）',
  'individual.last_name_kana':           '代表者の名前（カナ）',
  'individual.first_name_kanji':         '代表者の名前（漢字）',
  'individual.last_name_kanji':          '代表者の名前（漢字）',
  'individual.dob.day':                  '代表者の生年月日',
  'individual.dob.month':                '代表者の生年月日',
  'individual.dob.year':                 '代表者の生年月日',
  'individual.address_kana.postal_code': '代表者の住所（カナ）郵便番号',
  'individual.address_kana.city':        '代表者の住所（カナ）市区町村',
  'individual.address_kana.town':        '代表者の住所（カナ）町名',
  'individual.address_kana.line1':       '代表者の住所（カナ）番地',
  'individual.address_kanji.postal_code':'代表者の住所（漢字）郵便番号',
  'individual.address_kanji.city':       '代表者の住所（漢字）市区町村',
  'individual.address_kanji.town':       '代表者の住所（漢字）町名',
  'individual.address_kanji.line1':      '代表者の住所（漢字）番地',
  'individual.email':                    '代表者のメールアドレス',
  'individual.phone':                    '代表者の電話番号',
  'individual.id_number':                'マイナンバー（個人番号）',
  'individual.verification.document':    '本人確認書類',
  'business_profile.product_description':'商品・サービスの説明',
  'external_account':                    '振込先銀行口座',
  'tos_acceptance.date':                 '利用規約の同意',
  'tos_acceptance.service_agreement':    '利用規約（サービス契約）',
  'company.name':                        '法人名（漢字）',
  'company.name_kana':                   '法人名（カナ）',
};

interface Metrics {
  gmv: number;
  platformFee: number;
  activeUsers: number;
  totalStores: number;
  approvedStores: number;
  pendingStores: number;
  suspendedStores: number;
}

interface AdminStore {
  id: number;
  name: string;
  status: string;
  is_active: boolean;
  category: string;
  address: string;
  city: string;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  stripe_account_id: string | null;
  bag_count: number;
  reservation_count: number;
  revenue: number;
  rejection_reason: string | null;
}

interface AdminStoreDetail extends AdminStore {
  description: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  open_time: string | null;
  close_time: string | null;
  holiday: string | null;
  pickup_hours: string | null;
  license_number: string | null;
  license_image_url: string | null;
  id_image_url: string | null;
  pledge_signed: boolean;
  legal_name: string | null;
  legal_representative: string | null;
  legal_address: string | null;
  legal_phone: string | null;
  legal_email: string | null;
  legal_other: string | null;
  owner_email: string | null;
  stripe_charges_enabled: boolean | null;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
}

interface SalesLead {
  id: number;
  reportedBy: string | null;
  storeName: string;
  location: string;
  memo: string | null;
  status: string;
  createdAt: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n);
}

function statusBadge(store: AdminStore) {
  if (!store.is_active && store.status === 'approved') return { label: '一時停止', cls: 'bg-orange-100 text-orange-700' };
  switch (store.status) {
    case 'approved':      return { label: '承認済み',  cls: 'bg-emerald-100 text-emerald-700' };
    case 'pending_review':
    case 'pending':       return { label: '審査待ち',  cls: 'bg-amber-100 text-amber-700' };
    case 'applied':       return { label: '口座申請済', cls: 'bg-blue-100 text-blue-700' };
    case 'rejected':      return { label: '却下',      cls: 'bg-red-100 text-red-700' };
    case 'suspended':     return { label: '停止中',    cls: 'bg-red-100 text-red-700' };
    default:              return { label: store.status, cls: 'bg-secondary text-muted-foreground' };
  }
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-secondary/30 rounded-xl overflow-hidden">
      <div className="px-3 py-2 bg-secondary/50 border-b border-border/30">
        <p className="text-[11px] font-black text-foreground/70 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-3 py-2 space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({
  label, value, mono = false, multiline = false, copyable = false, link,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  multiline?: boolean;
  copyable?: boolean;
  link?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  if (!value) {
    return (
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">{label}</span>
        <span className="text-[11px] text-muted-foreground/40 italic">未入力</span>
      </div>
    );
  }
  async function copy() {
    await navigator.clipboard.writeText(value!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  const textEl = multiline
    ? <p className={`text-[11px] text-foreground leading-relaxed ${mono ? 'font-mono break-all' : ''}`}>{value}</p>
    : <span className={`text-[11px] text-foreground break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>;
  return (
    <div className="flex items-start justify-between gap-2 min-w-0">
      <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5 min-w-[72px]">{label}</span>
      <div className="flex items-start gap-1 min-w-0 flex-1">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-blue-600 underline break-all">{value}</a>
        ) : textEl}
        {copyable && (
          <button onClick={copy}
            className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:bg-border transition-colors">
            {copied ? '✓' : 'コピー'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, session, signOut, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=%2Fadmin', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const [metrics, setMetrics]             = useState<Metrics | null>(null);
  const [stores, setStores]               = useState<AdminStore[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [salesLeads, setSalesLeads]       = useState<SalesLead[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody]   = useState('');
  const [annSending, setAnnSending] = useState(false);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody]   = useState('');
  const [notifSending, setNotifSending] = useState(false);

  // ── アプリ設定 ──
  const [catchphrase,        setCatchphrase]        = useState('あなたの街のおすそわけ');
  const [subCatchphrase,     setSubCatchphrase]     = useState('おいしいものを、もっとみんなへ。');
  const [maintenanceMode,       setMaintenanceMode]       = useState(false);
  const [maintenanceTitle,      setMaintenanceTitle]      = useState('ただいまメンテナンス中です');
  const [maintenanceMessage,    setMaintenanceMessage]    = useState('より良いサービスのために、現在システムメンテナンスを行っています。\nしばらくお待ちください🙏');
  const [autoApproveStripe,     setAutoApproveStripe]     = useState(false);
  const [settingsSaving,        setSettingsSaving]        = useState(false);

  const [storeFilter, setStoreFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending');
  const [showAllStores, setShowAllStores] = useState(false);
  const [expandedStore, setExpandedStore] = useState<number | null>(null);
  // 却下モーダル
  const [rejectDialog, setRejectDialog] = useState<{ storeId: number; storeName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // Stripe警告モーダル（承認後にStripe未連携が発覚した場合）
  const [stripeWarnModal, setStripeWarnModal] = useState<{
    storeName: string;
    status: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      hasAccount: boolean;
      currentlyDue: string[];
      errors: { code: string; reason: string; requirement: string }[];
    };
  } | null>(null);
  const [expandedLead, setExpandedLead]   = useState<number | null>(null);
  const [storeDetails, setStoreDetails]   = useState<Record<number, AdminStoreDetail>>({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);
  const [lightboxImg, setLightboxImg]     = useState<string | null>(null);

  const token = session?.access_token;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return; }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mRes, sRes, aRes, lRes] = await Promise.all([
        fetch(`${BASE}/api/admin/metrics`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/stores`,        { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/sales-leads`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (sRes.ok) setStores(await sRes.json());
      if (aRes.ok) setAnnouncements(await aRes.json());
      if (lRes.ok) setSalesLeads(await lRes.json());
      // 設定の読み込み（グローバルキャッシュ経由）
      const appSettings = await fetchAppSettings();
      setCatchphrase(appSettings.catchphrase);
      setSubCatchphrase(appSettings.sub_catchphrase);
      setMaintenanceMode(appSettings.maintenance_mode === 'true');
      setMaintenanceTitle(appSettings.maintenance_title);
      setMaintenanceMessage(appSettings.maintenance_message);
      setAutoApproveStripe(appSettings.auto_approve_stripe_verified === 'true');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function saveSettings() {
    setSettingsSaving(true);
    try {
      const res = await fetch(`${BASE}/api/admin/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          catchphrase:                  catchphrase.trim(),
          sub_catchphrase:              subCatchphrase.trim(),
          maintenance_mode:             maintenanceMode ? 'true' : 'false',
          maintenance_title:            maintenanceTitle.trim(),
          maintenance_message:          maintenanceMessage.trim(),
          auto_approve_stripe_verified: autoApproveStripe ? 'true' : 'false',
        }),
      });
      if (res.ok) {
        await fetchAppSettings();  // グローバルキャッシュを更新
        toast({ title: maintenanceMode ? '🔧 メンテナンスモードON・設定を保存しました' : '✅ 設定を保存しました' });
      } else {
        toast({ title: 'エラー', variant: 'destructive' });
      }
    } finally {
      setSettingsSaving(false);
    }
  }

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function approveStore(storeId: number) {
    setActionLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAll();
        if (data.stripeStatus && !data.stripeStatus.ok) {
          const storeName = stores.find(st => st.id === storeId)?.name ?? '店舗';
          setStripeWarnModal({ storeName, status: data.stripeStatus });
        } else {
          toast({ title: '✅ 承認しました' });
        }
      } else {
        toast({ title: 'エラー', description: '承認に失敗しました', variant: 'destructive' });
      }
    } finally { setActionLoading(null); }
  }

  async function suspendStore(storeId: number) {
    if (!confirm('この店舗を一時停止しますか？')) return;
    setActionLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: '⏸ 一時停止しました' }); await fetchAll(); }
      else toast({ title: 'エラー', variant: 'destructive' });
    } finally { setActionLoading(null); }
  }

  function openRejectDialog(storeId: number, storeName: string) {
    setRejectReason('');
    setRejectDialog({ storeId, storeName });
  }

  async function confirmReject() {
    if (!rejectDialog) return;
    const { storeId } = rejectDialog;
    setActionLoading(storeId);
    setRejectDialog(null);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rejectionReason: rejectReason.trim() || null }),
      });
      if (res.ok) { toast({ title: '❌ 却下しました。オーナーに通知を送信しました。' }); await fetchAll(); }
      else toast({ title: 'エラー', description: '却下に失敗しました', variant: 'destructive' });
    } finally { setActionLoading(null); }
  }

  async function deleteStore(storeId: number, storeName: string) {
    if (!confirm(`「${storeName}」を完全に削除しますか？\nこの操作は取り消せません。`)) return;
    setActionLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: '🗑 店舗を削除しました' }); await fetchAll(); }
      else toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' });
    } finally { setActionLoading(null); }
  }

  async function sendAnnouncement() {
    if (!annTitle.trim() || !annBody.trim()) {
      toast({ title: 'タイトルと本文を入力してください', variant: 'destructive' }); return;
    }
    setAnnSending(true);
    try {
      const res = await fetch(`${BASE}/api/admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: annTitle.trim(), body: annBody.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `📣 配信完了！${data.userCount}人に送信されました` });
        setAnnTitle(''); setAnnBody('');
        await fetchAll();
      } else {
        toast({ title: 'エラー', description: data.error, variant: 'destructive' });
      }
    } finally { setAnnSending(false); }
  }

  async function sendNotification() {
    if (!notifTitle.trim()) {
      toast({ title: 'タイトルを入力してください', variant: 'destructive' }); return;
    }
    setNotifSending(true);
    try {
      const res = await fetch(`${BASE}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: notifTitle.trim(), body: notifBody.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: `🔔 通知完了！${data.sentTo}人に送信されました` });
        setNotifTitle(''); setNotifBody('');
      } else {
        toast({ title: 'エラー', description: data.error, variant: 'destructive' });
      }
    } finally { setNotifSending(false); }
  }

  async function fetchStoreDetail(storeId: number) {
    if (storeDetails[storeId] || detailLoading === storeId) return;
    setDetailLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStoreDetails(prev => ({ ...prev, [storeId]: data }));
      }
    } finally {
      setDetailLoading(null);
    }
  }

  function toggleExpand(storeId: number) {
    if (expandedStore === storeId) {
      setExpandedStore(null);
    } else {
      setExpandedStore(storeId);
      fetchStoreDetail(storeId);
    }
  }

  const isPending = (s: AdminStore) =>
    s.status === 'pending_review' || s.status === 'pending' || s.status === 'applied';

  const filteredStores = stores.filter(s => {
    if (storeFilter === 'pending')   return isPending(s);
    if (storeFilter === 'approved')  return s.status === 'approved' && s.is_active;
    if (storeFilter === 'suspended') return s.status === 'suspended' || s.status === 'rejected' || (s.status === 'approved' && !s.is_active);
    return true;
  });
  const displayedStores = showAllStores ? filteredStores : filteredStores.slice(0, 10);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="font-bold text-xl">アクセス権限がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-border/40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
            <span className="font-black text-foreground truncate">管理者ダッシュボード</span>
            <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full shrink-0">神モード</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchAll} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── ヒーロー指標バナー ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 35%, #2563eb 100%)' }}>
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-white/70" />
                <span className="text-xs font-bold text-white/70 tracking-widest uppercase">神モード 全体統計</span>
              </div>

              {/* 総売上 BIG */}
              {metrics ? (
                <>
                  <div className="mb-4">
                    <p className="text-[11px] text-white/60 font-medium mb-0.5">累計流通額 (GMV)</p>
                    <p className="text-5xl font-black text-white tracking-tight">¥{fmt(metrics.gmv)}</p>
                    <p className="text-xs text-white/60 mt-1">手数料収益 (25%): <span className="text-white/90 font-bold">¥{fmt(metrics.platformFee)}</span></p>
                  </div>

                  {/* 3つのビッグ数値 */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                      <p className="text-3xl font-black text-emerald-300">{metrics.approvedStores}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">アクティブ店舗</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                      <p className={`text-3xl font-black ${metrics.pendingStores > 0 ? 'text-amber-300' : 'text-white/50'}`}>
                        {metrics.pendingStores}
                      </p>
                      <p className="text-[10px] text-white/60 mt-0.5">審査待ち</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
                      <p className="text-3xl font-black text-sky-300">{metrics.activeUsers}</p>
                      <p className="text-[10px] text-white/60 mt-0.5">ユーザー数</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 mb-4">
                  <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />)}
                  </div>
                </div>
              )}
            </div>

            {/* 登録店舗合計バー */}
            <div className="bg-white/5 px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] text-white/60 font-medium flex items-center gap-1.5">
                <Store className="w-3 h-3" />登録店舗合計
              </span>
              <span className="text-sm font-black text-white">{metrics ? `${fmt(metrics.totalStores)}店` : '…'}</span>
            </div>
          </div>
        </motion.div>

        {/* ── 店舗審査パネル ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />店舗管理
            </h2>
            {metrics && metrics.pendingStores > 0 && (
              <span className="text-[11px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />{metrics.pendingStores}件 審査待ち
              </span>
            )}
          </div>

          {/* フィルタータブ */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {(['pending', 'approved', 'suspended', 'all'] as const).map(f => {
              const counts: Record<typeof f, number> = {
                pending:   stores.filter(isPending).length,
                approved:  stores.filter(s => s.status === 'approved' && s.is_active).length,
                suspended: stores.filter(s => s.status === 'suspended' || s.status === 'rejected' || (s.status === 'approved' && !s.is_active)).length,
                all:       stores.length,
              };
              const labels = { pending: '審査待ち', approved: '承認済み', suspended: '停止/却下', all: 'すべて' };
              return (
                <button key={f} onClick={() => { setStoreFilter(f); setShowAllStores(false); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${storeFilter === f ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                  {labels[f]} ({counts[f]})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-secondary/50 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-secondary/30 rounded-2xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
              <p className="font-bold text-foreground">
                {storeFilter === 'pending' ? '審査待ちの店舗はありません' : '該当する店舗はありません'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedStores.map(store => {
                const badge = statusBadge(store);
                const isProcessing = actionLoading === store.id;
                const isStorePending = isPending(store);
                const isApprovedActive = store.status === 'approved' && store.is_active;
                const isSuspended = !store.is_active || store.status === 'suspended' || store.status === 'rejected';
                return (
                  <motion.div key={store.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/60 rounded-2xl overflow-hidden"
                  >
                    {/* タップで展開 */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(store.id)}
                      className="w-full text-left"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {store.image_url ? (
                            <img src={store.image_url} alt={store.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-2xl">🏪</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-foreground">{store.name}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                              {store.stripe_account_id && (
                                store.stripe_charges_enabled === true
                                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Stripe有効</span>
                                  : store.stripe_charges_enabled === false
                                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Stripe制限中</span>
                                    : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Stripe未確認</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{store.address}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{store.bag_count}個</span>
                              <span className="flex items-center gap-0.5"><Receipt className="w-3 h-3" />{store.reservation_count}件</span>
                              <span className="text-primary font-bold">¥{fmt(Number(store.revenue ?? 0))}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-muted-foreground/50">
                            {expandedStore === store.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 展開詳細パネル */}
                    <AnimatePresence>
                      {expandedStore === store.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">

                            {/* 売上サマリー */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                <p className="text-base font-black text-emerald-700">¥{fmt(Number(store.revenue ?? 0))}</p>
                                <p className="text-[10px] text-emerald-600/70 mt-0.5">累計売上</p>
                              </div>
                              <div className="bg-sky-50 rounded-xl p-3 text-center">
                                <p className="text-base font-black text-sky-700">{store.reservation_count}</p>
                                <p className="text-[10px] text-sky-600/70 mt-0.5">総予約数</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-3 text-center">
                                <p className="text-base font-black text-purple-700">{store.bag_count}</p>
                                <p className="text-[10px] text-purple-600/70 mt-0.5">バッグ数</p>
                              </div>
                            </div>

                            {/* 詳細ロード中スピナー */}
                            {detailLoading === store.id && (
                              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                                <RefreshCw className="w-4 h-4 animate-spin" />詳細を取得中...
                              </div>
                            )}

                            {/* 詳細データ */}
                            {(() => {
                              const d = storeDetails[store.id];
                              if (!d) return null;
                              return (
                                <div className="space-y-3">

                                  {/* 却下理由バナー */}
                                  {store.status === 'rejected' && store.rejection_reason && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                      <p className="text-[11px] font-black text-red-600 mb-1">却下理由</p>
                                      <p className="text-xs text-red-700 leading-relaxed">{store.rejection_reason}</p>
                                    </div>
                                  )}

                                  {/* オーナー情報 */}
                                  <DetailSection title="👤 オーナー情報">
                                    <DetailRow label="メールアドレス" value={d.owner_email} copyable />
                                    <DetailRow label="オーナーID" value={d.owner_id} mono />
                                    <DetailRow label="登録日" value={new Date(d.created_at).toLocaleString('ja-JP')} />
                                  </DetailSection>

                                  {/* 基本情報 */}
                                  <DetailSection title="🏪 店舗基本情報">
                                    {d.description && <DetailRow label="説明" value={d.description} multiline />}
                                    <DetailRow label="住所" value={`${d.address}${d.city ? '（' + d.city + '）' : ''}`} />
                                    {d.phone && <DetailRow label="電話番号" value={d.phone} />}
                                    {(d.lat || d.lng) && (
                                      <DetailRow label="座標" value={`${d.lat}, ${d.lng}`}
                                        link={`https://maps.google.com/?q=${d.lat},${d.lng}`} />
                                    )}
                                    <DetailRow label="カテゴリ" value={d.category} />
                                  </DetailSection>

                                  {/* 営業時間 */}
                                  {(d.open_time || d.close_time || d.holiday || d.pickup_hours) && (
                                    <DetailSection title="🕐 営業時間">
                                      {d.open_time && <DetailRow label="開店" value={d.open_time} />}
                                      {d.close_time && <DetailRow label="閉店" value={d.close_time} />}
                                      {d.pickup_hours && <DetailRow label="受取時間" value={d.pickup_hours} />}
                                      {d.holiday && <DetailRow label="定休日" value={d.holiday} />}
                                    </DetailSection>
                                  )}

                                  {/* コンプライアンス書類 */}
                                  <DetailSection title="📋 コンプライアンス書類">
                                    <DetailRow label="許可証番号" value={d.license_number} />
                                    <DetailRow label="誓約書署名" value={d.pledge_signed ? '✅ 署名済み' : '❌ 未署名'} />
                                    <DetailRow
                                      label="Stripe口座"
                                      value={d.stripe_account_id ? `✅ ${d.stripe_account_id}` : '❌ 未連携'}
                                      mono={!!d.stripe_account_id}
                                    />
                                    {/* 書類画像 */}
                                    <div className="mt-2 space-y-2">
                                      {d.license_image_url && (
                                        <div>
                                          <p className="text-[10px] font-bold text-muted-foreground mb-1">営業許可証</p>
                                          <button
                                            onClick={() => setLightboxImg(d.license_image_url!)}
                                            className="block w-full"
                                          >
                                            <img
                                              src={d.license_image_url}
                                              alt="営業許可証"
                                              className="w-full max-h-40 object-contain rounded-xl border border-border bg-secondary/30 cursor-zoom-in hover:opacity-90 transition-opacity"
                                            />
                                          </button>
                                        </div>
                                      )}
                                      {d.id_image_url && (
                                        <div>
                                          <p className="text-[10px] font-bold text-muted-foreground mb-1">本人確認書類</p>
                                          <button
                                            onClick={() => setLightboxImg(d.id_image_url!)}
                                            className="block w-full"
                                          >
                                            <img
                                              src={d.id_image_url}
                                              alt="本人確認書類"
                                              className="w-full max-h-40 object-contain rounded-xl border border-border bg-secondary/30 cursor-zoom-in hover:opacity-90 transition-opacity"
                                            />
                                          </button>
                                        </div>
                                      )}
                                      {!d.license_image_url && !d.id_image_url && (
                                        <p className="text-[11px] text-muted-foreground italic">書類未アップロード</p>
                                      )}
                                    </div>
                                  </DetailSection>

                                  {/* 特定商取引法 */}
                                  {(d.legal_name || d.legal_representative || d.legal_address || d.legal_phone || d.legal_email || d.legal_other) && (
                                    <DetailSection title="⚖️ 特定商取引法情報">
                                      {d.legal_name && <DetailRow label="屋号・法人名" value={d.legal_name} />}
                                      {d.legal_representative && <DetailRow label="代表者名" value={d.legal_representative} />}
                                      {d.legal_address && <DetailRow label="住所" value={d.legal_address} />}
                                      {d.legal_phone && <DetailRow label="電話番号" value={d.legal_phone} />}
                                      {d.legal_email && <DetailRow label="メール" value={d.legal_email} copyable />}
                                      {d.legal_other && <DetailRow label="その他" value={d.legal_other} multiline />}
                                    </DetailSection>
                                  )}
                                </div>
                              );
                            })()}

                            {/* 店舗ページリンク */}
                            <Link href={`/stores/${store.id}`}>
                              <div className="flex items-center justify-center gap-1.5 bg-secondary/60 rounded-xl py-2 text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                                店舗公開ページを確認
                              </div>
                            </Link>

                            {/* アクションボタン */}
                            <div className="flex gap-2 flex-wrap">
                              {isStorePending && (
                                <>
                                  <button onClick={() => approveStore(store.id)} disabled={isProcessing}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                    承認する
                                  </button>
                                  <button onClick={() => openRejectDialog(store.id, store.name)} disabled={isProcessing}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2.5 rounded-xl transition-colors border border-red-200 disabled:opacity-50">
                                    <XCircle className="w-3.5 h-3.5" />
                                    却下
                                  </button>
                                </>
                              )}
                              {isApprovedActive && (
                                <button onClick={() => suspendStore(store.id)} disabled={isProcessing}
                                  className="flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors border border-orange-200 disabled:opacity-50">
                                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                                  一時停止
                                </button>
                              )}
                              {isSuspended && !isStorePending && (
                                <button onClick={() => approveStore(store.id)} disabled={isProcessing}
                                  className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors border border-emerald-200 disabled:opacity-50">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  再承認する
                                </button>
                              )}
                              {/* 削除ボタン — 審査待ち・却下済みのみ表示 */}
                              {(isStorePending || store.status === 'rejected') && (
                                <button onClick={() => deleteStore(store.id, store.name)} disabled={isProcessing}
                                  className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs py-2.5 px-3 rounded-xl transition-colors border border-red-200 disabled:opacity-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                  削除
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              {filteredStores.length > 10 && (
                <button onClick={() => setShowAllStores(v => !v)}
                  className="w-full py-3 flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                  {showAllStores
                    ? <><ChevronUp className="w-4 h-4" />折りたたむ</>
                    : <><ChevronDown className="w-4 h-4" />残り{filteredStores.length - 10}件を表示</>}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ── お知らせ配信パネル ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
              <Megaphone className="w-3.5 h-3.5" />お知らせ配信
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">タイトル</label>
                <input
                  type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                  placeholder="例：今日のおすそわけ情報"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">本文</label>
                <textarea
                  value={annBody} onChange={e => setAnnBody(e.target.value)} rows={3}
                  placeholder="全ユーザーに配信されるメッセージを入力してください"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <button onClick={sendAnnouncement} disabled={annSending || !annTitle.trim() || !annBody.trim()}
                className="w-full h-12 bg-primary text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm shadow-primary/20">
                {annSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                全ユーザーに配信する
              </button>
            </div>

            {announcements.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border/40">
                <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />配信済み ({announcements.length}件)
                </p>
                <div className="space-y-2">
                  {announcements.slice(0, 5).map(ann => (
                    <div key={ann.id} className="bg-secondary/40 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-foreground">{ann.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ann.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(ann.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── 通知ベル一斉送信パネル ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
              <Bell className="w-3.5 h-3.5" />通知ベル一斉送信
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">
              全ユーザーのアプリ内通知ベルにメッセージを送信します。
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">タイトル <span className="text-destructive">*</span></label>
                <input
                  type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  placeholder="例：新機能のお知らせ"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">本文 <span className="font-normal opacity-60">（任意）</span></label>
                <textarea
                  value={notifBody} onChange={e => setNotifBody(e.target.value)} rows={3}
                  placeholder="詳細メッセージを入力してください"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <button onClick={sendNotification} disabled={notifSending || !notifTitle.trim()}
                className="w-full h-12 bg-primary text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm shadow-primary/20">
                {notifSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                全ユーザーに通知する
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── アプリ設定パネル ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-5 space-y-5">

            {/* ─ 文言管理 ─ */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
                <Type className="w-3.5 h-3.5" />文言管理
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    キャッチコピー <span className="font-normal opacity-60">（ホームの地域名表示のデフォルト）</span>
                  </label>
                  <input
                    type="text" value={catchphrase} onChange={e => setCatchphrase(e.target.value)}
                    placeholder="あなたの街のおすそわけ"
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    サブキャッチコピー <span className="font-normal opacity-60">（将来の使用向け）</span>
                  </label>
                  <input
                    type="text" value={subCatchphrase} onChange={e => setSubCatchphrase(e.target.value)}
                    placeholder="おいしいものを、もっとみんなへ。"
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* ─ メンテナンスモード ─ */}
            <div className="pt-4 border-t border-border/40">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
                <Wrench className="w-3.5 h-3.5" />メンテナンスモード
              </h2>

              {/* トグルスイッチ */}
              <div
                onClick={() => setMaintenanceMode(v => !v)}
                className={`flex items-center justify-between px-4 py-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                  maintenanceMode
                    ? 'border-red-400 bg-red-50'
                    : 'border-border/60 bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <div>
                  <p className={`text-sm font-black ${maintenanceMode ? 'text-red-700' : 'text-foreground'}`}>
                    {maintenanceMode ? '🔧 メンテナンス中（ユーザーをブロック）' : 'メンテナンスモード OFF'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {maintenanceMode
                      ? '管理者とadminページは引き続きアクセス可能'
                      : 'ONにするとすべてのユーザーにメンテナンス画面を表示'}
                  </p>
                </div>
                {maintenanceMode
                  ? <ToggleRight className="w-8 h-8 text-red-500 shrink-0" />
                  : <ToggleLeft  className="w-8 h-8 text-muted-foreground/40 shrink-0" />}
              </div>

              {/* メンテナンス画面の文言 */}
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">メンテナンス画面タイトル</label>
                  <input
                    type="text" value={maintenanceTitle} onChange={e => setMaintenanceTitle(e.target.value)}
                    placeholder="ただいまメンテナンス中です"
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                    メンテナンス画面メッセージ <span className="font-normal opacity-60">（改行可）</span>
                  </label>
                  <textarea
                    value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} rows={3}
                    placeholder="しばらくお待ちください🙏"
                    className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ─ Stripe自動承認 ─ */}
            <div className="pt-4 border-t border-border/40">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
                <CreditCard className="w-3.5 h-3.5" />Stripe認証で自動公開
              </h2>

              <div
                onClick={() => setAutoApproveStripe(v => !v)}
                className={`flex items-center justify-between px-4 py-4 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                  autoApproveStripe
                    ? 'border-green-400 bg-green-50'
                    : 'border-border/60 bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <div>
                  <p className={`text-sm font-black ${autoApproveStripe ? 'text-green-700' : 'text-foreground'}`}>
                    {autoApproveStripe ? '⚡ Stripe KYC完了で自動承認 ON' : '自動承認 OFF（手動で承認）'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {autoApproveStripe
                      ? '店舗のStripe本人確認が完了した瞬間に自動で公開されます'
                      : 'ONにすると charges_enabled になった店舗を自動で approved + is_active にします'}
                  </p>
                </div>
                {autoApproveStripe
                  ? <ToggleRight className="w-8 h-8 text-green-500 shrink-0" />
                  : <ToggleLeft  className="w-8 h-8 text-muted-foreground/40 shrink-0" />}
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 px-1">
                ※ OFFでも Stripe KYC完了時に管理者へ承認依頼メールが届きます。
              </p>
            </div>

            {/* 保存ボタン */}
            <button onClick={saveSettings} disabled={settingsSaving}
              className={`w-full h-12 font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm ${
                maintenanceMode
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                  : 'bg-foreground text-background hover:bg-foreground/90'
              }`}>
              {settingsSaving
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Settings className="w-4 h-4" />}
              {maintenanceMode ? '🔧 設定を保存してメンテナンス開始' : '設定を保存する'}
            </button>

          </div>
        </motion.div>

        {/* ── 営業リード（食品ロスのお店情報）── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="bg-card rounded-3xl"
            style={{ boxShadow: '0 4px 16px -4px rgba(10,8,6,0.1)' }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-orange-500" />
                  <p className="font-black text-foreground">営業リード</p>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                    {salesLeads.filter(l => l.status === 'new').length} 件未対応
                  </span>
                </div>
              </div>

              {salesLeads.length === 0 ? (
                <div className="py-8 text-center">
                  <Flag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">まだリードはありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {salesLeads.map(lead => {
                    const isExpanded = expandedLead === lead.id;
                    const badgeCls = lead.status === 'new'       ? 'bg-orange-200 text-orange-800' :
                                     lead.status === 'contacted' ? 'bg-blue-200 text-blue-800' :
                                     lead.status === 'converted' ? 'bg-green-200 text-green-800' :
                                                                   'bg-gray-200 text-gray-700';
                    const cardCls  = lead.status === 'new'       ? 'bg-orange-50 border-orange-200' :
                                     lead.status === 'contacted' ? 'bg-blue-50 border-blue-200' :
                                     lead.status === 'converted' ? 'bg-green-50 border-green-200' :
                                                                   'bg-secondary border-border';
                    return (
                      <div key={lead.id} className={`rounded-2xl border ${cardCls}`}>
                        {/* ── 行ヘッダー（常に表示）── */}
                        <button
                          type="button"
                          onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-sm text-foreground">{lead.storeName}</p>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${badgeCls}`}>
                                {lead.status === 'new' ? '未対応' : lead.status === 'contacted' ? '連絡済み' : lead.status === 'converted' ? '成約' : 'クローズ'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.location}</span>
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                        </button>
                        {/* ── 展開詳細パネル ── */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-black/5">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">店舗名</p>
                              <p className="text-sm font-black text-foreground">{lead.storeName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">場所・エリア</p>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <p className="text-sm font-medium text-foreground">{lead.location}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">詳細メモ</p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {lead.memo || <span className="text-muted-foreground italic">（メモなし）</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">報告日時</p>
                              <p className="text-xs text-muted-foreground">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleString('ja-JP') : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">対応ステータス</p>
                              <select
                                value={lead.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  await fetch(`${BASE}/api/admin/sales-leads/${lead.id}`, {
                                    method:  'PATCH',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body:    JSON.stringify({ status: newStatus }),
                                  });
                                  setSalesLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
                                }}
                                className="w-full text-sm font-bold border border-border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                <option value="new">📌 未対応</option>
                                <option value="contacted">📞 連絡済み</option>
                                <option value="converted">✅ 成約</option>
                                <option value="closed">🚫 クローズ</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── 画像ライトボックス ── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxImg(null)}
          >
            <motion.img
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              src={lightboxImg}
              alt="書類確認"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain cursor-zoom-out"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
              onClick={() => setLightboxImg(null)}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 却下理由入力モーダル ── */}
      <AnimatePresence>
        {rejectDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setRejectDialog(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-black text-foreground text-sm">審査を却下しますか？</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]">{rejectDialog.storeName}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-wider">却下理由（オーナーに通知されます）</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="例：営業許可証の内容が確認できませんでした。再申請の際は、許可証の写真を鮮明なものに差し替えてください。"
                  className="w-full px-4 py-3 bg-secondary/50 rounded-xl text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground mt-1">※ 空欄の場合は理由なしで却下されます</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectDialog(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 py-3 rounded-xl font-black text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  却下する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stripe 未連携 警告モーダル ── */}
      <AnimatePresence>
        {stripeWarnModal && (() => {
          const s = stripeWarnModal.status;
          // currently_due を日本語に変換して重複排除
          const dueJa = [...new Set(
            s.currentlyDue.map(f => STRIPE_FIELD_JA[f] ?? f)
          )];
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
              onClick={() => setStripeWarnModal(null)}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* ヘッダー */}
                <div className="bg-amber-50 border-b border-amber-200 px-5 py-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-amber-900 text-sm">承認完了 — Stripe未連携を検出</p>
                    <p className="text-xs text-amber-700 truncate mt-0.5">{stripeWarnModal.storeName}</p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Stripe ステータスバッジ */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.chargesEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {s.chargesEnabled ? '✅' : '❌'} 支払受取
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.payoutsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {s.payoutsEnabled ? '✅' : '❌'} 銀行振込
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.hasAccount ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {s.hasAccount ? '✅' : '❌'} Stripe口座
                    </span>
                  </div>

                  {/* 未送信フィールド一覧 */}
                  {dueJa.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-foreground mb-2 uppercase tracking-wider">Stripeへ未送信の必須項目</p>
                      <ul className="space-y-1">
                        {dueJa.map((label, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stripe エラー詳細 */}
                  {s.errors.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-foreground mb-2 uppercase tracking-wider">Stripeエラー詳細</p>
                      <ul className="space-y-1.5">
                        {s.errors.map((e, i) => (
                          <li key={i} className="text-[11px] text-foreground/70 bg-secondary/50 rounded-lg px-3 py-2">
                            <span className="font-bold text-red-600">{STRIPE_FIELD_JA[e.requirement] ?? e.requirement}</span>
                            {e.reason && <span className="block text-muted-foreground mt-0.5">{e.reason}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2.5">
                    店舗の承認はDB上では完了しています。オーナーにStripe KYCの再送信を依頼するか、StripeダッシュボードでAccount IDを確認してください。
                  </p>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => setStripeWarnModal(null)}
                    className="w-full py-3 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors active:scale-95"
                  >
                    確認しました
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
