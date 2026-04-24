import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle, XCircle, Store, MapPin, Phone, RefreshCw,
  Clock, AlertCircle, Flag, MessageSquare, ShieldAlert,
} from 'lucide-react';
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
  status: 'pending' | 'applied' | 'approved' | 'rejected' | 'pending_review';
  createdAt: string;
  totalBagsAvailable: number;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean;
}

interface AdminReport {
  id: number;
  storeId: number;
  storeName: string | null;
  storeStatus: string | null;
  userId: string;
  reportType: 'closed' | 'temp_closed' | 'wrong_hours' | 'wrong_info' | 'other';
  comment: string | null;
  createdAt: string;
}

import { API_BASE } from '@/lib/api-base';
const BASE = API_BASE;

async function fetchAllAdminStores(): Promise<AdminStore[]> {
  const res = await fetch(`${BASE}/api/admin/stores`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
async function fetchAllReports(): Promise<AdminReport[]> {
  const res = await fetch(`${BASE}/api/admin/reports`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}
async function rejectStore(storeId: number): Promise<AdminStore> {
  const res = await fetch(`${BASE}/api/admin/stores/${storeId}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}
async function reactivateStore(storeId: number): Promise<AdminStore> {
  const res = await fetch(`${BASE}/api/admin/stores/${storeId}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reactivate');
  return res.json();
}
async function dismissReports(storeId: number) {
  const res = await fetch(`${BASE}/api/admin/stores/${storeId}/dismiss-reports`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to dismiss');
  return res.json();
}

const CATEGORY_LABELS: Record<string, string> = {
  meals: '🍱 料理・お惣菜',
  bakery_sweets: '🥐 パン・スイーツ',
  ingredients: '🍎 食材・その他',
  // 旧値後方互換
  restaurant: '🍱 料理・お惣菜',
  bakery: '🥐 パン・スイーツ',
  cafe: '🥐 パン・スイーツ',
  supermarket: '🍎 食材・その他',
  convenience: '🍱 料理・お惣菜',
  other: '🍱 料理・お惣菜',
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  closed: '閉店している',
  temp_closed: '一時休業中',
  wrong_hours: '営業時間が違う',
  wrong_info: '情報が間違っている',
  other: 'その他',
};

const STATUS_CONFIG = {
  pending:        { label: '口座登録待ち', bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-400' },
  applied:        { label: 'KYC申請中',   bg: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-400' },
  approved:       { label: '公開中',       bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:       { label: '非公開',       bg: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500' },
  pending_review: { label: '要確認',       bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
};

type StoreFilter = 'approved' | 'applied' | 'pending' | 'rejected' | 'pending_review' | 'all';
type ViewTab = 'stores' | 'reports';

export default function AdminVerifyShops() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StoreFilter>('all');
  const [viewTab, setViewTab] = useState<ViewTab>('stores');

  const { data: stores, isLoading: storesLoading, refetch: refetchStores } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: fetchAllAdminStores,
    refetchInterval: 30000,
  });
  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: fetchAllReports,
    refetchInterval: 30000,
  });

  const rejectMutation = useMutation({
    mutationFn: rejectStore,
    onSuccess: (store) => {
      toast({ title: `🚫 ${store.name} を非公開にしました` });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
    },
    onError: () => toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' }),
  });
  const reactivateMutation = useMutation({
    mutationFn: reactivateStore,
    onSuccess: (store) => {
      toast({ title: `✅ ${store.name} を再公開しました`, description: '地図に表示されます' });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
    },
    onError: () => toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' }),
  });
  const dismissMutation = useMutation({
    mutationFn: dismissReports,
    onSuccess: () => {
      toast({ title: '確認済みにしました', description: '店舗を公開中に戻しました' });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    },
    onError: () => toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' }),
  });

  const filtered = stores?.filter(s => filter === 'all' ? true : s.status === filter) ?? [];
  const counts = {
    approved:       stores?.filter(s => s.status === 'approved').length ?? 0,
    applied:        stores?.filter(s => s.status === 'applied').length ?? 0,
    pending:        stores?.filter(s => s.status === 'pending').length ?? 0,
    rejected:       stores?.filter(s => s.status === 'rejected').length ?? 0,
    pending_review: stores?.filter(s => s.status === 'pending_review').length ?? 0,
    total: stores?.length ?? 0,
  };

  const reportsByStore: Record<number, AdminReport[]> = {};
  reports?.forEach(r => {
    if (!reportsByStore[r.storeId]) reportsByStore[r.storeId] = [];
    reportsByStore[r.storeId].push(r);
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">店舗モニタリング</h1>
            <p className="text-sm text-muted-foreground mt-0.5">公開店舗の管理と報告の確認</p>
          </div>
          <button
            onClick={() => { refetchStores(); refetchReports(); }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center">
            <div className="text-xl font-black text-emerald-700">{counts.approved}</div>
            <div className="text-[9px] font-bold text-emerald-600 mt-0.5">公開中</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 text-center relative">
            <div className="text-xl font-black text-blue-700">{counts.applied}</div>
            <div className="text-[9px] font-bold text-blue-600 mt-0.5">KYC審査中</div>
            {counts.applied > 0 && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-center relative">
            <div className="text-xl font-black text-orange-700">{counts.pending}</div>
            <div className="text-[9px] font-bold text-orange-600 mt-0.5">口座未登録</div>
            {counts.pending > 0 && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 text-center relative">
            <div className="text-xl font-black text-orange-700">{counts.pending_review}</div>
            <div className="text-[9px] font-bold text-orange-600 mt-0.5">要確認</div>
            {counts.pending_review > 0 && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-center">
            <div className="text-xl font-black text-red-700">{counts.rejected}</div>
            <div className="text-[9px] font-bold text-red-600 mt-0.5">非公開</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex bg-muted p-1 rounded-xl mb-5 shadow-inner gap-1">
          <button
            onClick={() => setViewTab('stores')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${viewTab === 'stores' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Store className="w-3.5 h-3.5" /> 店舗一覧
          </button>
          <button
            onClick={() => setViewTab('reports')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${viewTab === 'reports' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'} relative`}
          >
            <Flag className="w-3.5 h-3.5" />
            報告一覧
            {(reports?.length ?? 0) > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none">
                {reports!.length}
              </span>
            )}
          </button>
        </div>

        {/* ── STORES VIEW ── */}
        {viewTab === 'stores' && (
          <>
            {/* Filter Tabs */}
            <div className="flex bg-muted/50 p-1 rounded-xl mb-5 shadow-inner gap-1 overflow-x-auto">
              {([
                { key: 'all',           label: `全て (${counts.total})` },
                { key: 'applied',       label: `KYC審査中 (${counts.applied})`,   urgent: counts.applied > 0 },
                { key: 'pending',       label: `口座未登録 (${counts.pending})`,   urgent: false },
                { key: 'pending_review',label: `要確認 (${counts.pending_review})`, urgent: counts.pending_review > 0 },
                { key: 'approved',      label: `公開中 (${counts.approved})` },
                { key: 'rejected',      label: `非公開 (${counts.rejected})` },
              ] as { key: StoreFilter; label: string; urgent?: boolean }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`shrink-0 px-3 py-2 text-xs font-bold rounded-lg transition-all relative ${
                    filter === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.urgent && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {storesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-36 bg-card rounded-2xl animate-pulse border border-border" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border">
                <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  {filter === 'pending_review' ? '要確認の店舗はありません'
                    : filter === 'rejected'     ? '非公開の店舗はありません'
                    : filter === 'applied'      ? 'KYC審査中の店舗はありません'
                    : filter === 'pending'      ? '口座登録待ちの店舗はありません'
                    : '店舗が見つかりません'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(store => {
                  const statusCfg = store.status === 'pending'
                    ? { ...STATUS_CONFIG.pending, label: store.stripeAccountId ? '本人確認待ち' : '口座未登録' }
                    : STATUS_CONFIG[store.status] ?? STATUS_CONFIG.approved;
                  const isProcessing = rejectMutation.isPending || reactivateMutation.isPending || dismissMutation.isPending;
                  const storeReports = reportsByStore[store.id] ?? [];
                  return (
                    <div key={store.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                            <div className="flex items-center gap-1.5 shrink-0">
                              {storeReports.length > 0 && (
                                <span className="flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <Flag className="w-3 h-3" />
                                  {storeReports.length}件
                                </span>
                              )}
                              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusCfg.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                              </span>
                            </div>
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
                            <span>登録: {new Date(store.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* pending_review: flagged by users */}
                      {store.status === 'pending_review' && (
                        <div className="border-t border-orange-200 bg-orange-50">
                          <div className="px-4 py-2 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-orange-700">ユーザーから{storeReports.length}件の報告があります</span>
                          </div>
                          <div className="grid grid-cols-2 gap-0 border-t border-orange-200">
                            <button onClick={() => rejectMutation.mutate(store.id)} disabled={isProcessing}
                              className="flex items-center justify-center gap-2 py-3 font-bold text-sm text-destructive hover:bg-destructive/5 transition-colors border-r border-orange-200 disabled:opacity-50">
                              <XCircle className="w-4 h-4" /> 非公開にする
                            </button>
                            <button onClick={() => dismissMutation.mutate(store.id)} disabled={isProcessing}
                              className="flex items-center justify-center gap-2 py-3 font-bold text-sm text-primary hover:bg-primary/5 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-4 h-4" /> 問題なし・継続
                            </button>
                          </div>
                        </div>
                      )}

                      {store.status === 'applied' && (
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-700">Stripe KYC 審査中 — 完了で自動公開</span>
                          </div>
                          {store.stripeAccountId && (
                            <span className="text-[10px] text-blue-500 font-mono">{store.stripeAccountId.slice(0, 14)}…</span>
                          )}
                        </div>
                      )}

                      {store.status === 'pending' && (
                        <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-bold text-orange-700">口座登録が未完了です</span>
                        </div>
                      )}

                      {(store.status === 'approved') && (
                        <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-700">地図に表示中</span>
                        </div>
                      )}

                      {store.status === 'rejected' && (
                        <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-bold text-red-700">非公開中</span>
                          </div>
                          <button onClick={() => reactivateMutation.mutate(store.id)} disabled={isProcessing}
                            className="text-xs font-bold text-primary hover:underline">
                            再公開する
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── REPORTS VIEW ── */}
        {viewTab === 'reports' && (
          <div>
            {reportsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse border border-border" />)}
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border">
                <Flag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">報告はありません</p>
                <p className="text-xs text-muted-foreground/60 mt-1">ユーザーからの店舗報告がここに表示されます</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">計 {reports.length} 件の報告</p>
                <div className="space-y-3">
                  {Object.entries(reportsByStore).map(([storeIdStr, storeReports]) => {
                    const storeId = Number(storeIdStr);
                    const storeName = storeReports[0].storeName ?? `店舗ID: ${storeId}`;
                    const storeStatus = storeReports[0].storeStatus;
                    const statusCfg = STATUS_CONFIG[storeStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.approved;
                    return (
                      <div key={storeId} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="font-black text-sm truncate">{storeName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{storeReports.length}件</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${statusCfg.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {storeReports.map(report => (
                            <div key={report.id} className="px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                                  <Flag className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                      {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {new Date(report.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {report.comment && (
                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                      <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                                      <p className="leading-relaxed">{report.comment}</p>
                                    </div>
                                  )}
                                  <p className="text-[10px] text-muted-foreground/40 mt-1">
                                    ユーザー: {report.userId.slice(0, 8)}…
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
