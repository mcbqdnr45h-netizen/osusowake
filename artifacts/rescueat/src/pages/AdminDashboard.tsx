import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, TrendingUp, Users, Store, Clock, CheckCircle, XCircle,
  Pause, Send, Megaphone, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  BadgeDollarSign, BarChart2, Bell, Settings, ToggleLeft, ToggleRight, Type, Wrench, CreditCard,
  LogOut, ExternalLink, Package, Receipt, Flag, MapPin, Trash2, FileWarning, Link2 as LinkIcon,
} from 'lucide-react';
import { fetchAppSettings } from '@/hooks/use-app-settings';

import { API_BASE } from '@/lib/api-base';
const BASE = API_BASE;

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
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  bag_count: number;
  reservation_count: number;
  revenue: number;
  rejection_reason: string | null;
  owner_store_count: number;
  owner_store_rank: number;
}

interface StripeRequirements {
  currently_due:        string[];
  eventually_due:       string[];
  errors:               { code: string; reason: string; requirement: string }[];
  disabled_reason:      string | null;
  pending_verification: string[];
  error?:               string;
  message?:             string;
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
  stripe_license_file_id: string | null;
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
  stripe_payouts_enabled: boolean | null;
  stripe_requirements: StripeRequirements | null;
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
  const { user, session, signOut, isLoading: authLoading, isAdmin } = useAuth();
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

  const [storeFilter, setStoreFilter] = useState<'all' | 'applied' | 'pending' | 'pending_review' | 'approved' | 'suspended'>('applied');
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
  const [syncingStripe, setSyncingStripe] = useState<number | null>(null);
  const [stripeErrors, setStripeErrors]   = useState<Record<number, string | null>>({});
  // ── Stripe アカウント手動リンク（孤立アカウント修復） ──
  const [linkStripeDialog, setLinkStripeDialog] = useState<{ storeId: number; storeName: string } | null>(null);
  const [linkStripeInput,  setLinkStripeInput]  = useState('');
  const [linkStripeLoading, setLinkStripeLoading] = useState(false);

  const token = session?.access_token;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!authLoading && !isAdmin) { navigate('/'); return; }
  }, [user, isAdmin, authLoading]);

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
      if (sRes.ok) {
        const storeData: AdminStore[] = await sRes.json();
        setStores(storeData);
        // Stripe アカウントを持つ店舗のステータスをバックグラウンドで自動更新
        if (storeData.some(s => s.stripe_account_id)) {
          fetch(`${BASE}/api/admin/stores/batch-refresh-stripe`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (!data?.updated) return;
              setStores(prev => prev.map(s => {
                const updated = data.updated[s.id];
                return updated !== undefined ? { ...s, stripe_charges_enabled: updated } : s;
              }));
            })
            .catch(() => {});
        }
      }
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
        const errData = await res.json().catch(() => ({}));
        if (errData?.error === 'stripe_restricted') {
          toast({
            title: '⛔ Stripe制限中のため承認できません',
            description: 'Stripeダッシュボードで書類不備を解消してから再度承認してください。',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'エラー', description: errData?.message ?? '承認に失敗しました', variant: 'destructive' });
        }
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

  async function syncStripeForStore(storeId: number) {
    setSyncingStripe(storeId);
    try {
      const res = await fetch(`${BASE}/api/stores/${storeId}/stripe-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.stripeError) {
          setStripeErrors(prev => ({ ...prev, [storeId]: data.stripeError }));
          setStores(prev => prev.map(s => s.id === storeId
            ? { ...s, stripe_charges_enabled: false, stripe_payouts_enabled: false }
            : s
          ));
          toast({ title: '⚠️ Stripe連携エラーを検出', description: `エラー: ${data.stripeError}`, variant: 'destructive' });
        } else {
          setStripeErrors(prev => ({ ...prev, [storeId]: null }));
          setStores(prev => prev.map(s => s.id === storeId
            ? { ...s, stripe_charges_enabled: data.chargesEnabled, stripe_payouts_enabled: data.payoutsEnabled }
            : s
          ));
          // storeDetails も更新（license_file_id / charges / payouts）
          setStoreDetails(prev => {
            const existing = prev[storeId];
            if (!existing) return prev;
            return {
              ...prev,
              [storeId]: {
                ...existing,
                stripe_charges_enabled: data.chargesEnabled,
                stripe_payouts_enabled: data.payoutsEnabled,
                stripe_license_file_id: data.licenseFileId ?? existing.stripe_license_file_id,
              },
            };
          });
          const fileTag = data.licenseFileId ? ` / File: ✅ 取得済み` : '';
          toast({ title: '✅ Stripe再同期完了', description: `決済: ${data.chargesEnabled ? '有効' : '制限中'} / 入金: ${data.payoutsEnabled ? '有効' : '停止中'}${fileTag}` });
        }
      } else {
        toast({ title: 'エラー', description: '再同期に失敗しました', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'エラー', description: 'サーバーへの接続に失敗しました', variant: 'destructive' });
    } finally {
      setSyncingStripe(null);
    }
  }

  async function disconnectStripe(storeId: number, storeName: string) {
    if (!confirm(`「${storeName}」のStripe口座連携を解除しますか？\n\n⚠️ 注意：保留中・振込可能の残高がある場合、その金額は旧銀行口座に振り込まれます。旧口座が閉鎖済みの場合は振込失敗のリスクがあります。\n\n残高¥0を確認してから実行することを推奨します。`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/stripe-disconnect`, { method: 'POST' });
      if (res.ok) {
        setStores(prev => prev.map(s => s.id === storeId ? { ...s, stripe_account_id: null, stripe_charges_enabled: false, stripe_payouts_enabled: false } : s));
        setStoreDetails(prev => {
          const existing = prev[storeId];
          if (!existing) return prev;
          return { ...prev, [storeId]: { ...existing, stripe_account_id: null, stripe_charges_enabled: false, stripe_payouts_enabled: false, stripe_license_file_id: null } };
        });
        toast({ title: '✅ Stripe連携を解除しました', description: 'オーナーのマイページに口座再登録の案内が表示されます' });
      } else {
        toast({ title: 'エラー', description: '解除に失敗しました', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'エラー', description: 'サーバーへの接続に失敗しました', variant: 'destructive' });
    }
  }

  async function linkStripeAccount() {
    if (!linkStripeDialog || !linkStripeInput.startsWith('acct_')) return;
    setLinkStripeLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${linkStripeDialog.storeId}/link-stripe-account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stripeAccountId: linkStripeInput.trim() }),
      });
      if (res.ok) {
        setStores(prev => prev.map(s => s.id === linkStripeDialog.storeId
          ? { ...s, stripe_account_id: linkStripeInput.trim() } : s));
        toast({ title: '✅ Stripe IDをリンクしました', description: `店舗 #${linkStripeDialog.storeId} → ${linkStripeInput.trim()}` });
        setLinkStripeDialog(null);
        setLinkStripeInput('');
        // 続けてStripe情報を再同期
        await syncStripeForStore(linkStripeDialog.storeId);
      } else {
        const err = await res.json();
        toast({ title: 'エラー', description: err.message ?? 'リンクに失敗しました', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'エラー', description: 'サーバーへの接続に失敗しました', variant: 'destructive' });
    } finally {
      setLinkStripeLoading(false);
    }
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
        // Stripe ライブ値を store リストの in-memory にも反映（バッジズレ防止）
        if (data.stripe_charges_enabled != null || data.stripe_payouts_enabled != null) {
          setStores(prev => prev.map(s => s.id === storeId
            ? {
                ...s,
                stripe_charges_enabled: data.stripe_charges_enabled ?? s.stripe_charges_enabled,
                stripe_payouts_enabled: data.stripe_payouts_enabled ?? s.stripe_payouts_enabled,
              }
            : s
          ));
        }
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
    if (storeFilter === 'applied')        return s.status === 'applied';
    if (storeFilter === 'pending')        return s.status === 'pending';
    if (storeFilter === 'pending_review') return s.status === 'pending_review';
    if (storeFilter === 'approved')       return s.status === 'approved' && s.is_active;
    if (storeFilter === 'suspended')      return s.status === 'suspended' || s.status === 'rejected' || (s.status === 'approved' && !s.is_active);
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

  if (!isAdmin) {
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

                  {/* 5つのビッグ数値 */}
                  <div className="grid grid-cols-5 gap-1.5 mb-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className="text-2xl font-black text-emerald-300">{metrics.approvedStores}</p>
                      <p className="text-[9px] text-white/60 mt-0.5 leading-tight">公開中</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className={`text-2xl font-black ${stores.filter(s => s.status === 'applied').length > 0 ? 'text-blue-300' : 'text-white/50'}`}>
                        {stores.filter(s => s.status === 'applied').length}
                      </p>
                      <p className="text-[9px] text-white/60 mt-0.5 leading-tight">KYC審査中</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className={`text-2xl font-black ${stores.filter(s => s.status === 'pending').length > 0 ? 'text-orange-300' : 'text-white/50'}`}>
                        {stores.filter(s => s.status === 'pending').length}
                      </p>
                      <p className="text-[9px] text-white/60 mt-0.5 leading-tight">口座未登録</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className={`text-2xl font-black ${stores.filter(s => s.status === 'pending_review').length > 0 ? 'text-amber-300' : 'text-white/50'}`}>
                        {stores.filter(s => s.status === 'pending_review').length}
                      </p>
                      <p className="text-[9px] text-white/60 mt-0.5 leading-tight">要確認</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center border border-white/10">
                      <p className="text-2xl font-black text-sky-300">{metrics.activeUsers}</p>
                      <p className="text-[9px] text-white/60 mt-0.5 leading-tight">ユーザー数</p>
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
            {stores.filter(s => s.status === 'applied').length > 0 && (
              <span className="text-[11px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />{stores.filter(s => s.status === 'applied').length}件 KYC審査中
              </span>
            )}
          </div>

          {/* フィルタータブ */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {([
              { key: 'applied',        label: 'KYC審査中',  urgent: stores.filter(s => s.status === 'applied').length > 0 },
              { key: 'pending',        label: '口座未登録',  urgent: false },
              { key: 'pending_review', label: '要確認',      urgent: stores.filter(s => s.status === 'pending_review').length > 0 },
              { key: 'approved',       label: '公開中',       urgent: false },
              { key: 'suspended',      label: '停止/却下',    urgent: false },
              { key: 'all',            label: 'すべて',       urgent: false },
            ] as { key: typeof storeFilter; label: string; urgent: boolean }[]).map(f => {
              const tabCount = (() => {
                if (f.key === 'applied')        return stores.filter(s => s.status === 'applied').length;
                if (f.key === 'pending')        return stores.filter(s => s.status === 'pending').length;
                if (f.key === 'pending_review') return stores.filter(s => s.status === 'pending_review').length;
                if (f.key === 'approved')       return stores.filter(s => s.status === 'approved' && s.is_active).length;
                if (f.key === 'suspended')      return stores.filter(s => s.status === 'suspended' || s.status === 'rejected' || (s.status === 'approved' && !s.is_active)).length;
                return stores.length;
              })();
              return (
                <button key={f.key} onClick={() => { setStoreFilter(f.key); setShowAllStores(false); }}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${storeFilter === f.key ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                  {f.label} ({tabCount})
                  {f.urgent && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />}
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
                {storeFilter === 'applied'        ? 'KYC審査中の店舗はありません'
                 : storeFilter === 'pending'      ? '口座未登録の店舗はありません'
                 : storeFilter === 'pending_review'? '要確認の店舗はありません'
                 : '該当する店舗はありません'}
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
                              {(store.owner_store_count ?? 1) >= 2 && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 flex items-center gap-0.5">
                                  🏪 {store.owner_store_rank ?? '?'}店舗目 / 計{store.owner_store_count}店
                                </span>
                              )}
                              {store.stripe_account_id && (() => {
                                // storeDetails のライブ値を優先、なければ DB 値を使う
                                const d = storeDetails[store.id];
                                const chargesOk = d?.stripe_charges_enabled ?? store.stripe_charges_enabled;
                                const payoutsOk = d?.stripe_payouts_enabled ?? store.stripe_payouts_enabled;
                                if (stripeErrors[store.id]) {
                                  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">🔴 連携エラー</span>;
                                }
                                // payouts_enabled=true は完全認証済み（最優先）
                                if (payoutsOk === true) {
                                  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ Stripe有効・入金可</span>;
                                }
                                if (chargesOk === true) {
                                  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⚠️ Stripe有効・入金停止</span>;
                                }
                                if (chargesOk === false) {
                                  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">❌ Stripe制限中</span>;
                                }
                                return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Stripe未確認</span>;
                              })()}
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
                                    <DetailRow label="誓約書署名" value={d.pledge_signed ? '✅ 署名済み' : '❌ 未署名'} />
                                    <DetailRow
                                      label="Stripe口座"
                                      value={d.stripe_account_id ? `✅ ${d.stripe_account_id}` : '❌ 未連携'}
                                      mono={!!d.stripe_account_id}
                                      copyable={!!d.stripe_account_id}
                                    />
                                    {d.stripe_account_id && (
                                      <>
                                        {/* Stripe Files API ファイルID */}
                                        {d.stripe_license_file_id ? (
                                          <DetailRow
                                            label="Stripe File ID"
                                            value={`✅ ${d.stripe_license_file_id}`}
                                            mono copyable
                                          />
                                        ) : (
                                          <div className="flex items-start justify-between gap-2">
                                            <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5 min-w-[72px]">Stripe File ID</span>
                                            {(d.stripe_charges_enabled && d.stripe_payouts_enabled) ? (
                                              <span className="text-[11px] text-muted-foreground">—（DB未記録・決済は有効）</span>
                                            ) : (
                                              <span className="text-[11px] text-amber-600 font-semibold">❌ 未提出（Stripe未送信）</span>
                                            )}
                                          </div>
                                        )}

                                        {stripeErrors[store.id] && (
                                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-red-700 mb-1">
                                            🔴 連携エラー: {stripeErrors[store.id]}
                                          </div>
                                        )}

                                        <DetailRow
                                          label="決済 / 入金"
                                          value={
                                            stripeErrors[store.id]
                                              ? '🔴 Stripe接続エラー — 再同期してください'
                                              : `決済: ${d.stripe_charges_enabled === true ? '✅ 有効' : d.stripe_charges_enabled === false ? '❌ 制限中' : '未確認'}　入金: ${d.stripe_payouts_enabled === true ? '✅ 有効' : d.stripe_payouts_enabled === false ? '❌ 停止中' : '未確認'}`
                                          }
                                        />

                                        {/* Stripe ライブ requirements */}
                                        {d.stripe_requirements && !d.stripe_requirements.error && (
                                          <div className="mt-2 rounded-xl border border-border bg-secondary/10 p-2.5 space-y-1.5">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide">📡 Stripe ライブ確認事項</p>

                                            {d.stripe_requirements.disabled_reason && (
                                              <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                                                <span className="text-[10px] font-black text-red-700">停止理由:</span>
                                                <span className="text-[10px] text-red-600 font-mono">{d.stripe_requirements.disabled_reason}</span>
                                              </div>
                                            )}

                                            {d.stripe_requirements.currently_due.length > 0 ? (
                                              <div>
                                                <p className="text-[10px] font-bold text-amber-700 mb-0.5">⚠️ 今すぐ必要な項目 ({d.stripe_requirements.currently_due.length}件)</p>
                                                {d.stripe_requirements.currently_due.map((item, i) => (
                                                  <div key={i} className="text-[10px] font-mono text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mb-0.5">{item}</div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-[10px] text-emerald-700 font-bold">✅ 未解決の必要項目なし</p>
                                            )}

                                            {d.stripe_requirements.errors.length > 0 && (
                                              <div>
                                                <p className="text-[10px] font-bold text-red-700 mb-0.5">🚫 エラー ({d.stripe_requirements.errors.length}件)</p>
                                                {d.stripe_requirements.errors.map((e, i) => (
                                                  <div key={i} className="text-[10px] font-mono text-red-800 bg-red-50 rounded px-1.5 py-0.5 mb-0.5">
                                                    [{e.code}] {e.requirement}: {e.reason}
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {d.stripe_requirements.pending_verification.length > 0 && (
                                              <p className="text-[10px] text-blue-600 font-semibold">
                                                🔄 審査中: {d.stripe_requirements.pending_verification.join(', ')}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {d.stripe_requirements?.error && (
                                          <div className="text-[10px] text-red-600 bg-red-50 rounded-lg px-2 py-1.5 mt-1">
                                            🔴 Stripe API エラー: {d.stripe_requirements.error}
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {/* ─── オーナー確認（本人確認書類）─── */}
                                    <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-3 space-y-2">
                                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">オーナー確認（本人確認・口座）</p>
                                      {d.id_image_url ? (
                                        <button
                                          onClick={() => setLightboxImg(d.id_image_url!)}
                                          className="block w-full"
                                        >
                                          <img
                                            src={d.id_image_url}
                                            alt="本人確認書類"
                                            className="w-full max-h-36 object-contain rounded-lg border border-border bg-background cursor-zoom-in hover:opacity-90 transition-opacity"
                                          />
                                        </button>
                                      ) : d.stripe_account_id ? (
                                        <p className="text-[11px] text-emerald-600 font-semibold">✅ Stripe共有済み（bank-setup完了）</p>
                                      ) : (
                                        <p className="text-[11px] text-amber-600 font-semibold">⚠️ 本人確認未完了（bank-setup未実施）</p>
                                      )}
                                    </div>

                                    {/* ─── この店舗の営業許可証 ─── */}
                                    <div className="mt-2 rounded-xl border border-border bg-secondary/20 p-3 space-y-2">
                                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                                        この店舗の営業許可証
                                        {d.license_number && (
                                          <span className="ml-2 font-normal normal-case text-foreground/70">{d.license_number}</span>
                                        )}
                                      </p>
                                      {d.license_image_url ? (
                                        <button
                                          onClick={() => setLightboxImg(d.license_image_url!)}
                                          className="block w-full"
                                        >
                                          <img
                                            src={d.license_image_url}
                                            alt="営業許可証"
                                            className="w-full max-h-40 object-contain rounded-lg border border-border bg-background cursor-zoom-in hover:opacity-90 transition-opacity"
                                          />
                                        </button>
                                      ) : (
                                        <p className="text-[11px] text-destructive font-semibold">❌ 未提出（要確認）</p>
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
                            {/* Stripe制限中の警告（payouts_enabled=true なら非表示） */}
                            {store.stripe_account_id && store.stripe_charges_enabled === false && store.stripe_payouts_enabled !== true && (
                              <div className="mb-2 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-[11px] font-bold text-red-600">
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                {stripeErrors[store.id]
                                  ? 'Stripe連携エラーが検出されています。アカウントIDを確認してください。'
                                  : 'Stripe制限中のため承認できません。書類不備を解消してください。'
                                }
                              </div>
                            )}
                            {/* Stripe File ID 警告
                                非表示条件:
                                  - payouts_enabled = true（Stripe審査通過）
                                  - または charges_enabled = true（決済有効 = Stripe書類送信済み）
                                  - または store が approved かつ charges_enabled = true
                            */}
                            {store.stripe_account_id && storeDetails[store.id] && !storeDetails[store.id].stripe_license_file_id && store.stripe_payouts_enabled !== true && store.stripe_charges_enabled !== true && (
                              <div className="mb-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-bold text-amber-700">
                                <FileWarning className="w-3.5 h-3.5 shrink-0" />
                                ⚠️ 営業許可証が Stripe に未送信です（stripe-sync ボタンで再送信可能）
                              </div>
                            )}
                            {/* Stripe再同期ボタン */}
                            {store.stripe_account_id && (
                              <div className="mb-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => syncStripeForStore(store.id)}
                                  disabled={syncingStripe === store.id}
                                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-xl transition-colors border border-blue-200 disabled:opacity-50"
                                >
                                  {syncingStripe === store.id
                                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    : <RefreshCw className="w-3.5 h-3.5" />
                                  }
                                  Stripe再同期
                                </button>
                                <button
                                  type="button"
                                  onClick={() => disconnectStripe(store.id, store.name)}
                                  className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 px-3 rounded-xl transition-colors border border-red-200"
                                  title="口座変更・再連携のために使用"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  口座リセット
                                </button>
                              </div>
                            )}
                            {/* Stripe ID 手動リンク — stripe_account_id が未設定の店舗向け */}
                            {!store.stripe_account_id && (
                              <div className="mb-2">
                                <button
                                  type="button"
                                  onClick={() => { setLinkStripeDialog({ storeId: store.id, storeName: store.name }); setLinkStripeInput(''); }}
                                  className="w-full flex items-center justify-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs py-2 rounded-xl transition-colors border border-violet-200"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Stripe IDを手動リンク（孤立アカウント修復）
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {isStorePending && (
                                <>
                                  <button onClick={() => approveStore(store.id)}
                                    disabled={isProcessing || (store.stripe_account_id != null && store.stripe_charges_enabled === false)}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
                                <button onClick={() => approveStore(store.id)}
                                  disabled={isProcessing || (store.stripe_account_id != null && store.stripe_charges_enabled === false)}
                                  className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed">
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

      {/* ── Stripe ID 手動リンク モーダル ───────────────────────────────── */}
      <AnimatePresence>
        {linkStripeDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setLinkStripeDialog(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-violet-600" />
                <h2 className="font-black text-gray-900 text-base">Stripe ID 手動リンク</h2>
              </div>
              <p className="text-xs text-gray-500 mb-1 font-medium">店舗名</p>
              <p className="text-sm font-bold text-gray-800 mb-4 truncate">{linkStripeDialog.storeName}</p>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                bank-setup の途中でエラーが起きて Stripe アカウントが孤立した場合、<br/>
                Stripe ダッシュボードから該当アカウントの ID（<code className="text-violet-700">acct_...</code>）をコピーして入力してください。
              </p>
              <input
                type="text"
                value={linkStripeInput}
                onChange={e => setLinkStripeInput(e.target.value)}
                placeholder="acct_1TGtRJGp2d1GdBCz"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 mb-4"
              />
              {linkStripeInput && !linkStripeInput.startsWith('acct_') && (
                <p className="text-xs text-red-500 mb-3">acct_ で始まるIDを入力してください</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLinkStripeDialog(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={linkStripeAccount}
                  disabled={linkStripeLoading || !linkStripeInput.startsWith('acct_')}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors disabled:opacity-40"
                >
                  {linkStripeLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'リンクして同期'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
