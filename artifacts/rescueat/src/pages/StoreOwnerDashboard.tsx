import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Store, Package, LogOut, RefreshCw, Loader2, AlertCircle,
  ChevronRight, TrendingUp, ShoppingBag, PlusCircle,
  Minus, Plus, Power, BarChart3, Zap, ShieldAlert,
  CreditCard, ExternalLink,
} from 'lucide-react';

interface StoreData {
  id: number;
  name: string;
  address: string | null;
  status: string;
  isActive: boolean;
  stripeAccountId: string | null;
}

interface BagData {
  id: number;
  title: string;
  discountedPrice: number;
  originalPrice: number;
  stockCount: number;
  isActive: boolean;
  pickupStart: string | null;
  pickupEnd: string | null;
}

interface TodaySales {
  gross: number;
  platformFee: number;
  net: number;
  count: number;
  connected: boolean;
}

interface ConnectStatus {
  connected: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId?: string;
}

function GuardScreen({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-foreground font-bold mb-2">{message}</p>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-checked={checked}
      role="switch"
    >
      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
        checked ? 'translate-x-7' : 'translate-x-0'
      }`} />
    </button>
  );
}

export default function StoreOwnerDashboard() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const [, navigate] = useLocation();

  const [store, setStore] = useState<StoreData | null | undefined>(undefined);
  const [bags, setBags] = useState<BagData[]>([]);
  const [todaySales, setTodaySales] = useState<TodaySales | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingBags, setLoadingBags] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyStopping, setEmergencyStopping] = useState(false);
  const [emergencyStopped, setEmergencyStopped] = useState(false);

  // 視覚フィードバック: 保存完了した bag の ID セット（緑光り）
  const [flashGreen, setFlashGreen] = useState<Set<number>>(new Set());
  const flashTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const triggerFlash = (bagId: number) => {
    setFlashGreen(prev => new Set(prev).add(bagId));
    const existing = flashTimers.current.get(bagId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setFlashGreen(prev => { const s = new Set(prev); s.delete(bagId); return s; });
      flashTimers.current.delete(bagId);
    }, 1200);
    flashTimers.current.set(bagId, t);
  };

  const fetchStore = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/stores/by-owner?userId=${userId}`);
      if (res.status === 404) { setStore(null); return null; }
      if (!res.ok) throw new Error('店舗情報の取得に失敗しました');
      const data = await res.json();
      setStore(data);
      return data as StoreData;
    } catch (err: any) {
      setError(err.message); return null;
    } finally {
      setLoadingStore(false);
    }
  }, []);

  const fetchBags = useCallback(async (storeId: number) => {
    setLoadingBags(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/bags`);
      if (!res.ok) throw new Error('商品の取得に失敗しました');
      setBags(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingBags(false);
    }
  }, []);

  const fetchTodaySales = useCallback(async (storeId: number) => {
    setLoadingSales(true);
    try {
      const res = await fetch(`/api/stores/${storeId}/today-sales`);
      if (res.ok) setTodaySales(await res.json());
    } catch { } finally {
      setLoadingSales(false);
    }
  }, []);

  const fetchConnectStatus = useCallback(async (storeId: number) => {
    try {
      const res = await fetch(`/api/stores/${storeId}/connect/status`);
      if (res.ok) setConnectStatus(await res.json());
    } catch { }
  }, []);

  const handleConnectOnboard = async () => {
    if (!store) return;
    setConnectLoading(true);
    try {
      const base = `${window.location.origin}${import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}`;
      const res = await fetch(`/api/stores/${store.id}/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${base}/store/dashboard?stripe_connect=return`,
          refreshUrl: `${base}/store/dashboard?stripe_connect=refresh`,
        }),
      });
      if (!res.ok) throw new Error('オンボーディングリンクの取得に失敗しました');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
      setConnectLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStore(user.id).then((s) => {
      if (s) {
        fetchBags(s.id);
        fetchTodaySales(s.id);
        fetchConnectStatus(s.id);
      }
    });
    // Stripe オンボーディングからの戻り検出
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_connect') === 'return') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, fetchStore, fetchBags, fetchTodaySales, fetchConnectStatus]);

  const handleRefresh = async () => {
    if (!store) return;
    setRefreshing(true);
    await Promise.all([fetchBags(store.id), fetchTodaySales(store.id), fetchConnectStatus(store.id)]);
    setRefreshing(false);
  };

  // バッグを更新してフラッシュ（ポップアップなし）
  const updateBag = useCallback(async (bagId: number, patch: Partial<{ stockCount: number; isActive: boolean }>) => {
    try {
      const res = await fetch(`/api/bags/${bagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('更新に失敗しました');
      const updated = await res.json();
      setBags(prev => prev.map(b => b.id === bagId ? { ...b, ...updated } : b));
      triggerFlash(bagId);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // 在庫変更 → 0になったら自動完売（isActive=false）
  const handleStockChange = (bag: BagData, delta: number) => {
    const newCount = Math.max(0, bag.stockCount + delta);
    const autoStop = newCount === 0;
    // 楽観的UI更新
    setBags(prev => prev.map(b =>
      b.id === bag.id ? { ...b, stockCount: newCount, isActive: autoStop ? false : b.isActive } : b
    ));
    updateBag(bag.id, { stockCount: newCount, ...(autoStop ? { isActive: false } : {}) });
  };

  const handleToggleActive = (bag: BagData) => {
    const newActive = !bag.isActive;
    setBags(prev => prev.map(b => b.id === bag.id ? { ...b, isActive: newActive } : b));
    updateBag(bag.id, { isActive: newActive });
  };

  // 緊急全停止: 全バッグを isActive=false に
  const handleEmergencyStop = async () => {
    if (bags.length === 0) return;
    setEmergencyStopping(true);
    const activeBagIds = bags.filter(b => b.isActive).map(b => b.id);
    // 楽観的UI
    setBags(prev => prev.map(b => ({ ...b, isActive: false })));
    await Promise.all(activeBagIds.map(id => updateBag(id, { isActive: false })));
    setEmergencyStopping(false);
    setEmergencyStopped(true);
    setTimeout(() => setEmergencyStopped(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/store/login');
  };

  if (authLoading || store === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <GuardScreen message="このページを表示するにはログインが必要です">
        <Link href="/store/login">
          <button className="mt-4 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            ログインする
          </button>
        </Link>
      </GuardScreen>
    );
  }

  if (profile && profile.role !== 'store_owner') {
    return (
      <GuardScreen message="このページは店舗オーナー専用です">
        <Link href="/"><button className="mt-4 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl">ホームへ戻る</button></Link>
      </GuardScreen>
    );
  }

  if (store === null) {
    return (
      <div className="min-h-dvh bg-background px-4 py-10 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
          <Store className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-xl font-black text-foreground mb-2">店舗が登録されていません</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">ダッシュボードを使い始める前に、まず店舗を登録してください。</p>
        <Link href="/register-store">
          <button className="bg-primary text-primary-foreground font-black px-8 py-4 rounded-2xl text-base shadow-lg shadow-primary/20 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />店舗を登録する
          </button>
        </Link>
      </div>
    );
  }

  const activeBags = bags.filter(b => b.isActive && b.stockCount > 0);
  const soldOutBags = bags.filter(b => b.stockCount === 0);
  const stoppedBags = bags.filter(b => !b.isActive);
  const anyActive = bags.some(b => b.isActive);

  return (
    <div className="min-h-dvh bg-background">

      {/* ── ヘッダー ── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-black text-foreground text-sm leading-tight truncate max-w-[160px]">{store.name}</p>
              <p className="text-[10px] text-muted-foreground">店舗ダッシュボード</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRefresh} disabled={refreshing}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleSignOut}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-24 space-y-4">

        {/* ── エラー ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
              <button onClick={() => setError(null)} className="ml-auto text-lg leading-none">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stripe 未設定警告バナー ── */}
        <AnimatePresence>
          {connectStatus !== null && !(connectStatus.detailsSubmitted && connectStatus.chargesEnabled) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-800 text-sm leading-tight">
                    【重要】お支払いの受取設定を完了させてください
                  </p>
                  <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                    {connectStatus.connected
                      ? 'Stripe の審査・設定が完了していません。お客様からの入金を受け取るには設定を完了してください。'
                      : '売上を受け取るには、Stripe Connect の銀行口座登録が必要です。'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectOnboard}
                disabled={connectLoading}
                className="mt-3 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                {connectLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><ExternalLink className="w-4 h-4" />今すぐ振込先を登録する</>
                }
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 緊急停止スイッチ ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <AnimatePresence mode="wait">
            {emergencyStopped ? (
              <motion.div key="stopped"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="w-full py-4 bg-green-50 border-2 border-green-300 rounded-2xl flex items-center justify-center gap-2.5 text-green-700 font-black text-base">
                ✓ 全商品を停止しました
              </motion.div>
            ) : (
              <motion.button key="btn"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={handleEmergencyStop}
                disabled={emergencyStopping || !anyActive}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] border-2
                  ${anyActive
                    ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                    : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                  }`}
              >
                {emergencyStopping
                  ? <><Loader2 className="w-5 h-5 animate-spin" />停止中...</>
                  : <><ShieldAlert className="w-5 h-5" />緊急停止 — 全商品を一括非表示</>
                }
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── 今日の売上カード ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm font-bold text-primary-foreground/80">今日の売上（手数料控除後）</span>
            </div>
            {loadingSales && <Loader2 className="w-4 h-4 animate-spin text-primary-foreground/60" />}
          </div>
          {todaySales ? (
            <>
              <p className="text-4xl font-black tracking-tight mb-1">¥{todaySales.net.toLocaleString()}</p>
              <div className="flex items-center gap-4 text-xs text-primary-foreground/70 font-medium">
                <span>総売上 ¥{todaySales.gross.toLocaleString()}</span>
                <span>手数料 ¥{todaySales.platformFee.toLocaleString()}</span>
                <span>{todaySales.count}件</span>
              </div>
              {!todaySales.connected && (
                <div className="mt-3 bg-white/10 rounded-xl px-3 py-2 text-xs font-bold">
                  Stripe未連携のため売上データが表示できません
                </div>
              )}
            </>
          ) : (
            <div className="h-10 flex items-center"><p className="text-3xl font-black">--</p></div>
          )}
        </motion.div>

        {/* ── KPIサマリー ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: '出品中', value: activeBags.length, icon: Package, color: 'text-primary bg-primary/10' },
            { label: '完売', value: soldOutBags.length, icon: ShoppingBag, color: 'text-orange-500 bg-orange-100' },
            { label: '停止中', value: stoppedBags.length, icon: Power, color: 'text-muted-foreground bg-muted' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── 新規出品ボタン ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link href="/store-dashboard">
            <button className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform">
              <Zap className="w-5 h-5" />
              新しいバッグを出品する
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </Link>
        </motion.div>

        {/* ── 在庫管理リスト ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="font-black text-foreground">在庫管理</h2>
            <span className="ml-auto text-xs text-muted-foreground font-bold bg-secondary px-2 py-0.5 rounded-full">{bags.length}件</span>
          </div>

          {loadingBags ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : bags.length === 0 ? (
            <div className="py-12 text-center px-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">出品中の商品がありません</p>
              <p className="text-xs text-muted-foreground mt-1">「新しいバッグを出品する」から追加してください</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {bags.map((bag) => {
                const isFlashing = flashGreen.has(bag.id);
                const isSoldOut = bag.stockCount === 0;
                return (
                  <motion.div key={bag.id} layout
                    className={`px-4 py-4 transition-colors duration-300 ${
                      isSoldOut ? 'bg-orange-50/60' :
                      !bag.isActive ? 'opacity-55 bg-muted/20' : ''
                    }`}>

                    {/* 商品名 + 完売バッジ + トグル */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-black text-foreground text-base truncate">{bag.title}</p>
                          <AnimatePresence>
                            {isSoldOut && (
                              <motion.span
                                key="sold-out"
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                className="shrink-0 text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full"
                              >
                                SOLD OUT
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">¥{bag.discountedPrice.toLocaleString()}</span>
                          <span className="line-through ml-1.5 text-xs">¥{bag.originalPrice.toLocaleString()}</span>
                          {bag.pickupStart && bag.pickupEnd && (
                            <span className="ml-2 text-xs">📍 {bag.pickupStart}〜{bag.pickupEnd}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <ToggleSwitch
                          checked={bag.isActive}
                          onChange={() => handleToggleActive(bag)}
                        />
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {bag.isActive ? '出品中' : '停止中'}
                        </span>
                      </div>
                    </div>

                    {/* 在庫数コントロール */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-12">残在庫</span>
                      <div className="flex items-center bg-secondary rounded-2xl overflow-hidden border border-border">
                        <button
                          onClick={() => handleStockChange(bag, -1)}
                          disabled={bag.stockCount === 0}
                          className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted active:bg-muted/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-14 text-center select-none">
                          <span
                            className={`text-2xl font-black transition-colors duration-300 ${
                              isFlashing ? 'text-green-500' :
                              isSoldOut ? 'text-orange-500' :
                              bag.stockCount <= 2 ? 'text-orange-400' : 'text-foreground'
                            }`}
                          >
                            {bag.stockCount}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStockChange(bag, +1)}
                          className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted active:bg-muted/70 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className={`text-sm font-black transition-colors duration-300 ${
                        isFlashing ? 'text-green-500' :
                        isSoldOut ? 'text-orange-500' :
                        bag.stockCount <= 2 ? 'text-orange-400' : 'text-muted-foreground'
                      }`}>
                        {isSoldOut ? '完売' : bag.stockCount <= 2 ? '残りわずか！' : '個'}
                      </span>
                    </div>

                    {/* 在庫0の自動停止メッセージ */}
                    <AnimatePresence>
                      {isSoldOut && !bag.isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] font-bold text-orange-500 mt-2 flex items-center gap-1"
                        >
                          ⚡ 在庫0のためユーザー側から自動的に非表示になりました
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── 詳細機能へ ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Link href="/store-dashboard">
            <button className="w-full py-3.5 border-2 border-border rounded-2xl text-sm font-bold text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/40 hover:text-foreground transition-colors">
              <BarChart3 className="w-4 h-4" />
              分析・予約管理・詳細設定
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
