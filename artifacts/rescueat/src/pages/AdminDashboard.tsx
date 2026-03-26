import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  ShieldCheck, TrendingUp, Users, Store, Clock, CheckCircle, XCircle,
  Pause, Send, Megaphone, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  BadgeDollarSign, BarChart2, Bell,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const ADMIN_EMAIL = 'yuuhi0125416@icloud.com';

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
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
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
    case 'rejected':      return { label: '却下',      cls: 'bg-red-100 text-red-700' };
    case 'suspended':     return { label: '停止中',    cls: 'bg-red-100 text-red-700' };
    default:              return { label: store.status, cls: 'bg-secondary text-muted-foreground' };
  }
}

export default function AdminDashboard() {
  const { user, session } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [metrics, setMetrics]             = useState<Metrics | null>(null);
  const [stores, setStores]               = useState<AdminStore[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody]   = useState('');
  const [annSending, setAnnSending] = useState(false);

  const [storeFilter, setStoreFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('pending');
  const [showAllStores, setShowAllStores] = useState(false);

  const token = session?.access_token;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return; }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [mRes, sRes, aRes] = await Promise.all([
        fetch(`${BASE}/api/admin/metrics`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/stores`,        { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (sRes.ok) setStores(await sRes.json());
      if (aRes.ok) setAnnouncements(await aRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function approveStore(storeId: number) {
    setActionLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: '✅ 承認しました' }); await fetchAll(); }
      else toast({ title: 'エラー', description: '承認に失敗しました', variant: 'destructive' });
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

  async function rejectStore(storeId: number) {
    if (!confirm('この店舗を却下しますか？')) return;
    setActionLoading(storeId);
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${storeId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: '❌ 却下しました' }); await fetchAll(); }
      else toast({ title: 'エラー', variant: 'destructive' });
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

  const filteredStores = stores.filter(s => {
    if (storeFilter === 'pending')   return s.status === 'pending_review' || s.status === 'pending';
    if (storeFilter === 'approved')  return s.status === 'approved' && s.is_active;
    if (storeFilter === 'suspended') return !s.is_active || s.status === 'suspended' || s.status === 'rejected';
    return true;
  });
  const displayedStores = showAllStores ? filteredStores : filteredStores.slice(0, 10);

  if (user && user.email !== ADMIN_EMAIL) {
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
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span className="font-black text-foreground">管理者ダッシュボード</span>
            <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">神モード</span>
          </div>
          <button onClick={fetchAll} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── メトリクスパネル ── */}
        {metrics && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />全体統計
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '流通額 (GMV)',          value: `¥${fmt(metrics.gmv)}`,         icon: TrendingUp,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: '手数料収益 (25%)',       value: `¥${fmt(metrics.platformFee)}`, icon: BadgeDollarSign,  color: 'text-primary',     bg: 'bg-primary/5' },
                { label: 'アクティブユーザー',     value: `${fmt(metrics.activeUsers)}人`, icon: Users,           color: 'text-sky-600',     bg: 'bg-sky-50' },
                { label: '登録店舗',               value: `${fmt(metrics.totalStores)}店`, icon: Store,           color: 'text-purple-600',  bg: 'bg-purple-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 flex items-start gap-3`}>
                  <div className={`${color} mt-0.5 shrink-0`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium leading-tight mb-1">{label}</p>
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: '承認済み', n: metrics.approvedStores,  color: 'text-emerald-600' },
                { label: '審査待ち', n: metrics.pendingStores,   color: 'text-amber-600' },
                { label: '停止中',   n: metrics.suspendedStores, color: 'text-red-600' },
              ].map(({ label, n, color }) => (
                <div key={label} className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${color}`}>{n}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
                pending:   stores.filter(s => s.status === 'pending_review' || s.status === 'pending').length,
                approved:  stores.filter(s => s.status === 'approved' && s.is_active).length,
                suspended: stores.filter(s => !s.is_active || s.status === 'suspended' || s.status === 'rejected').length,
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
                const isPending = store.status === 'pending_review' || store.status === 'pending';
                const isApprovedActive = store.status === 'approved' && store.is_active;
                const isSuspended = !store.is_active || store.status === 'suspended' || store.status === 'rejected';
                return (
                  <motion.div key={store.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border/60 rounded-2xl overflow-hidden"
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
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{store.address}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span>バッグ {store.bag_count}個</span>
                            <span>予約 {store.reservation_count}件</span>
                            <span className="text-primary font-bold">¥{fmt(Number(store.revenue ?? 0))}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground/60">
                              {new Date(store.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {isPending && (
                          <>
                            <button onClick={() => approveStore(store.id)} disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50">
                              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              承認する
                            </button>
                            <button onClick={() => rejectStore(store.id)} disabled={isProcessing}
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
                        {isSuspended && !isPending && (
                          <button onClick={() => approveStore(store.id)} disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors border border-emerald-200 disabled:opacity-50">
                            <CheckCircle className="w-3.5 h-3.5" />
                            再承認する
                          </button>
                        )}
                      </div>
                    </div>
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

      </div>
    </div>
  );
}
