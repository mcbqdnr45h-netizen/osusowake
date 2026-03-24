import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, XCircle, Store, MapPin, Phone,
  FileText, ShieldCheck, Clock, Eye, EyeOff, RefreshCw,
  AlertCircle, Bell, BarChart2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface PendingStore {
  id: number;
  name: string;
  address: string;
  city: string;
  category: string;
  phone: string | null;
  imageUrl: string | null;
  licenseNumber: string | null;
  licenseImageUrl: string | null;
  idImageUrl: string | null;
  pledgeSigned: boolean;
  status: string;
  createdAt: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  bakery: '🥐', restaurant: '🍱', cafe: '☕',
  supermarket: '🛒', convenience: '🏪', other: '🍴',
};

async function fetchPending(): Promise<PendingStore[]> {
  const res = await fetch(`${BASE}/api/admin/stores/pending`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}
async function fetchAllStores(): Promise<PendingStore[]> {
  const res = await fetch(`${BASE}/api/admin/stores`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

function ImageViewer({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-32 bg-secondary rounded-xl overflow-hidden hover:opacity-90 transition-opacity relative group"
      >
        <img src={src} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">{label}</div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <img src={src} alt={label} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StoreCard({ store, onApprove, onReject, approving, rejecting }: {
  store: PendingStore;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden shrink-0">
          {store.imageUrl ? (
            <img src={store.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {CATEGORY_EMOJI[store.category] || '🍴'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-foreground">{store.name}</h3>
            <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> 審査待ち
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{store.address}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            申請: {new Date(store.createdAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-px bg-border mx-4 rounded-xl overflow-hidden mb-4">
        <div className="bg-card p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-bold">ジャンル</p>
          <p className="text-sm font-black">{CATEGORY_EMOJI[store.category]} {store.category}</p>
        </div>
        <div className="bg-card p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-bold">誓約</p>
          <p className={`text-sm font-black ${store.pledgeSigned ? 'text-emerald-600' : 'text-rose-500'}`}>
            {store.pledgeSigned ? '✓ 同意済' : '✗ 未同意'}
          </p>
        </div>
        <div className="bg-card p-2.5 text-center">
          <p className="text-[10px] text-muted-foreground font-bold">許可証No.</p>
          <p className="text-xs font-black truncate">{store.licenseNumber || '—'}</p>
        </div>
      </div>

      {/* Expand for documents */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border-t border-border/60 text-sm font-bold text-muted-foreground hover:bg-secondary/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> 提出書類を確認
        </span>
        {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {store.licenseImageUrl ? (
                <ImageViewer src={store.licenseImageUrl} label="営業許可証" />
              ) : (
                <div className="w-full h-20 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-destructive font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> 営業許可証なし
                  </span>
                </div>
              )}
              {store.idImageUrl ? (
                <ImageViewer src={store.idImageUrl} label="本人確認書類" />
              ) : (
                <div className="w-full h-20 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-destructive font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> 本人確認書類なし
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 p-4 border-t border-border/60">
        <button
          onClick={onReject}
          disabled={approving || rejecting}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-destructive/30 text-destructive font-bold text-sm hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {rejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          却下する
        </button>
        <button
          onClick={onApprove}
          disabled={approving || rejecting}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md shadow-emerald-200"
        >
          {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          承認する
        </button>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [actingId, setActingId] = useState<number | null>(null);
  const [actingType, setActingType] = useState<'approve' | 'reject' | null>(null);

  const pendingQuery = useQuery({ queryKey: ['admin-pending'], queryFn: fetchPending, refetchInterval: 30_000 });
  const allQuery = useQuery({ queryKey: ['admin-all'], queryFn: fetchAllStores, enabled: tab === 'all' });

  async function handleApprove(id: number) {
    setActingId(id); setActingType('approve');
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ['admin-pending'] });
      await qc.invalidateQueries({ queryKey: ['admin-all'] });
      toast({
        title: '✅ 承認しました！',
        description: '店舗に「承認されました！出品を開始できます」と通知しました（ダミー）',
      });
    } catch {
      toast({ title: '承認失敗', variant: 'destructive' });
    } finally {
      setActingId(null); setActingType(null);
    }
  }

  async function handleReject(id: number) {
    setActingId(id); setActingType('reject');
    try {
      const res = await fetch(`${BASE}/api/admin/stores/${id}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ['admin-pending'] });
      await qc.invalidateQueries({ queryKey: ['admin-all'] });
      toast({ title: '却下しました', description: '店舗への通知を送りました（ダミー）' });
    } catch {
      toast({ title: '却下失敗', variant: 'destructive' });
    } finally {
      setActingId(null); setActingType(null);
    }
  }

  const pendingStores = pendingQuery.data ?? [];
  const allStores = allQuery.data ?? [];
  const displayStores = tab === 'pending' ? pendingStores : allStores;

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-600',
    pending_review: 'bg-blue-100 text-blue-700',
  };

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-md mx-auto pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-foreground leading-tight">管理者ダッシュボード</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
          <button
            onClick={() => { pendingQuery.refetch(); allQuery.refetch(); }}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${pendingQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="px-4 pt-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-amber-600">{pendingStores.length}</p>
              <p className="text-[10px] font-bold text-amber-600/70 mt-0.5">審査待ち</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-600">
                {allStores.filter(s => s.status === 'approved').length}
              </p>
              <p className="text-[10px] font-bold text-emerald-600/70 mt-0.5">承認済み</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-foreground">{allStores.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">合計</p>
            </div>
          </div>

          {/* Pending alert */}
          {pendingStores.length > 0 && tab === 'pending' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {pendingStores.length}件の申請が承認待ちです
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('pending')}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${tab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              審査待ち {pendingStores.length > 0 && `(${pendingStores.length})`}
            </button>
            <button onClick={() => setTab('all')}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${tab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              全店舗
            </button>
          </div>

          {/* Content */}
          {pendingQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'pending' ? (
            <AnimatePresence>
              {pendingStores.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-secondary/50 rounded-2xl p-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-foreground">全て対応済みです！</p>
                  <p className="text-xs text-muted-foreground mt-1">審査待ちの申請はありません</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {pendingStores.map(store => (
                    <StoreCard
                      key={store.id}
                      store={store}
                      onApprove={() => handleApprove(store.id)}
                      onReject={() => handleReject(store.id)}
                      approving={actingId === store.id && actingType === 'approve'}
                      rejecting={actingId === store.id && actingType === 'reject'}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          ) : (
            <div className="space-y-3">
              {allStores.map(store => (
                <div key={store.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-11 h-11 bg-muted rounded-xl overflow-hidden shrink-0">
                    {store.imageUrl
                      ? <img src={store.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">{CATEGORY_EMOJI[store.category] || '🍴'}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground truncate">{store.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${statusColors[store.status] || 'bg-secondary text-muted-foreground'}`}>
                    {store.status === 'pending' ? '審査待ち'
                      : store.status === 'approved' ? '承認済'
                      : store.status === 'rejected' ? '却下'
                      : 'レビュー中'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
