import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Store, MapPin, Phone, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AdminStore {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  category: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  totalBagsAvailable: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function fetchAllAdminStores(): Promise<AdminStore[]> {
  const res = await fetch(`${BASE}/api/admin/stores`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function approveStore(storeId: number): Promise<AdminStore> {
  const res = await fetch(`${BASE}/api/admin/stores/${storeId}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json();
}

async function rejectStore(storeId: number): Promise<AdminStore> {
  const res = await fetch(`${BASE}/api/admin/stores/${storeId}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '🍱 レストラン',
  bakery: '🥐 ベーカリー',
  cafe: '☕ カフェ',
  supermarket: '🛒 スーパー',
  convenience: '🏪 コンビニ',
  other: '🍴 その他',
};

const STATUS_CONFIG = {
  pending: { label: '審査待ち', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-400' },
  approved: { label: '承認済み', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: '却下', bg: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
};

export default function AdminVerifyShops() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const { data: stores, isLoading, refetch } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: fetchAllAdminStores,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: approveStore,
    onSuccess: (store) => {
      toast({ title: `✅ ${store.name} を承認しました`, description: '地図に表示されます' });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
    },
    onError: () => toast({ title: 'エラー', description: '承認に失敗しました', variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectStore,
    onSuccess: (store) => {
      toast({ title: `❌ ${store.name} を却下しました` });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    },
    onError: () => toast({ title: 'エラー', description: '却下に失敗しました', variant: 'destructive' }),
  });

  const filtered = stores?.filter(s => filter === 'all' ? true : s.status === filter) ?? [];
  const counts = {
    pending: stores?.filter(s => s.status === 'pending').length ?? 0,
    approved: stores?.filter(s => s.status === 'approved').length ?? 0,
    rejected: stores?.filter(s => s.status === 'rejected').length ?? 0,
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">店舗承認管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">申請店舗を審査して地図公開を制御します</p>
          </div>
          <button
            onClick={() => refetch()}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-amber-700">{counts.pending}</div>
            <div className="text-xs font-bold text-amber-600 mt-0.5">審査待ち</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-emerald-700">{counts.approved}</div>
            <div className="text-xs font-bold text-emerald-600 mt-0.5">承認済み</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-red-700">{counts.rejected}</div>
            <div className="text-xs font-bold text-red-600 mt-0.5">却下</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-muted p-1 rounded-xl mb-5 shadow-inner">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {tab === 'pending' ? `審査待ち (${counts.pending})`
                : tab === 'approved' ? `承認済み (${counts.approved})`
                : tab === 'rejected' ? `却下 (${counts.rejected})`
                : '全て'}
            </button>
          ))}
        </div>

        {/* Store List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-36 bg-card rounded-2xl animate-pulse border border-border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {filter === 'pending' ? '審査待ちの店舗はありません' : '該当する店舗はありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(store => {
              const statusCfg = STATUS_CONFIG[store.status];
              const isProcessing = approveMutation.isPending || rejectMutation.isPending;
              return (
                <div key={store.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Store image or placeholder */}
                  <div className="flex">
                    <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-secondary overflow-hidden">
                      {store.imageUrl ? (
                        <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-black text-base leading-tight">{store.name}</h3>
                        <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{CATEGORY_LABELS[store.category] ?? store.category}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                      {store.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>申請: {new Date(store.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (only for pending) */}
                  {store.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-0 border-t border-border">
                      <button
                        onClick={() => rejectMutation.mutate(store.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 py-3.5 font-bold text-sm text-destructive hover:bg-destructive/5 transition-colors border-r border-border disabled:opacity-50 active:scale-[0.98]"
                      >
                        <XCircle className="w-4 h-4" />
                        却下する
                      </button>
                      <button
                        onClick={() => approveMutation.mutate(store.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 py-3.5 font-bold text-sm text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 active:scale-[0.98]"
                      >
                        {(approveMutation.isPending) ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        地図に公開する
                      </button>
                    </div>
                  )}

                  {store.status === 'approved' && (
                    <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">地図に表示中</span>
                    </div>
                  )}

                  {store.status === 'rejected' && (
                    <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-bold text-red-700">却下済み</span>
                      </div>
                      <button
                        onClick={() => approveMutation.mutate(store.id)}
                        disabled={isProcessing}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        やはり承認する
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
