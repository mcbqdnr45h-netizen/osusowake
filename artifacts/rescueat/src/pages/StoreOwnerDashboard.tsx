import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Store, Package, ClipboardList, CheckCircle2, Clock,
  MapPin, ChevronRight, Loader2, AlertCircle, PlusCircle,
  ShoppingBag, BarChart3, Settings, LogOut,
} from 'lucide-react';

interface StoreRecord {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone_number?: string | null;
  status: 'pending' | 'active';
  created_at: string;
}

interface ProductRecord {
  id: string;
  title: string;
  discount_price: number;
  original_price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface OrderRecord {
  id: string;
  bag_title: string | null;
  store_name: string | null;
  final_price: number;
  status: 'unpicked' | 'picked_up' | 'cancelled';
  pickup_code: string | null;
  created_at: string;
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

// ── 店舗登録フォーム ────────────────────────────────────────────
function StoreRegistrationForm({ userId, onRegistered }: { userId: string; onRegistered: (store: StoreRecord) => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim().length >= 1 && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setIsLoading(true);

    const { data, error: err } = await supabase
      .from('stores')
      .insert({
        owner_id: userId,
        name: name.trim(),
        address: address.trim() || null,
        status: 'active',
      })
      .select()
      .single();

    setIsLoading(false);

    if (err) {
      setError('店舗情報の登録に失敗しました: ' + err.message);
      return;
    }

    onRegistered(data as StoreRecord);
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-10">
      <div className="max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* アイコン */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Store className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-foreground text-center mb-1">店舗情報を登録</h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            ダッシュボードを使い始める前に、店舗の基本情報を入力してください
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 店舗名 */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                店舗名 <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Store className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="例：佐藤ベーカリー"
                  className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 住所 */}
            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                住所 <span className="text-xs font-normal text-muted-foreground">（任意）</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="例：大阪府大阪市北区梅田1-1-1"
                  className="w-full bg-card border-2 border-border rounded-xl pl-11 pr-4 py-3.5 text-foreground font-medium placeholder:text-muted-foreground/60 placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* エラー */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium px-4 py-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!isValid}
              className={`w-full font-black text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2
                ${isValid
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98]'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" />登録中...</>
                : <><CheckCircle2 className="w-5 h-5" />店舗を登録してスタート</>
              }
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// ── 本体ダッシュボード ──────────────────────────────────────────
function Dashboard({ store, userId }: { store: StoreRecord; userId: string }) {
  const [, navigate] = useLocation();
  const { signOut } = useAuth();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // Supabase products からこの店舗の商品を取得
    supabase
      .from('products')
      .select('id, title, discount_price, original_price, stock_quantity, is_active')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts((data as ProductRecord[]) || []);
        setLoadingProducts(false);
      });

    // Supabase orders から今日の注文を取得（store_name で絞り込み）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    supabase
      .from('orders')
      .select('id, bag_title, store_name, final_price, status, pickup_code, created_at')
      .eq('store_name', store.name)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRecord[]) || []);
        setLoadingOrders(false);
      });
  }, [store]);

  const unpickedOrders = orders.filter(o => o.status === 'unpicked');
  const pickedOrders = orders.filter(o => o.status === 'picked_up');
  const activeProducts = products.filter(p => p.is_active && p.stock_quantity > 0);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-foreground text-sm leading-tight">{store.name}</p>
              <p className="text-[10px] text-muted-foreground">店舗ダッシュボード</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/store-dashboard">
              <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                <Settings className="w-3.5 h-3.5" />
                旧管理画面
              </button>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">

        {/* ウェルカムバナー */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <p className="text-primary-foreground/70 text-xs font-bold mb-1">ようこそ 👋</p>
          <h1 className="text-xl font-black">{store.name}</h1>
          {store.address && (
            <p className="text-primary-foreground/70 text-xs mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{store.address}
            </p>
          )}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[11px] font-black ${
            store.status === 'active'
              ? 'bg-green-400/20 text-green-100'
              : 'bg-amber-400/20 text-amber-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${store.status === 'active' ? 'bg-green-300' : 'bg-amber-300'}`} />
            {store.status === 'active' ? '営業中' : '審査中'}
          </div>
        </motion.div>

        {/* KPI カード */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: '出品中', value: activeProducts.length, icon: Package, color: 'text-primary bg-primary/10' },
            { label: '受取待ち', value: unpickedOrders.length, icon: Clock, color: 'text-amber-600 bg-amber-100' },
            { label: '本日受取済', value: pickedOrders.length, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* 出品登録ボタン */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <Link href="/store-dashboard">
            <button className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black text-base flex items-center justify-center gap-2.5 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]">
              <PlusCircle className="w-5 h-5" />
              本日の出品を登録する
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </Link>
        </motion.div>

        {/* ── 現在の在庫状況 ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="font-black text-foreground">現在の在庫状況</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-bold">
              Supabase products
            </span>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">商品がまだありません</p>
              <p className="text-xs text-muted-foreground mt-1">「本日の出品を登録する」から追加できます</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {products.map(product => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      ¥{product.discount_price.toLocaleString()}
                      <span className="line-through ml-1.5 text-muted-foreground/50">¥{product.original_price.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className={`text-right shrink-0 ${product.stock_quantity === 0 ? 'text-destructive' : 'text-foreground'}`}>
                    <p className="text-lg font-black">{product.stock_quantity}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">残在庫</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    !product.is_active ? 'bg-muted-foreground/40' :
                    product.stock_quantity === 0 ? 'bg-destructive' : 'bg-green-500'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── 本日の予約・受取待ち ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              <h2 className="font-black text-foreground">本日の予約・受取待ち</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-bold">
              Supabase orders
            </span>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">本日の注文はまだありません</p>
              <p className="text-xs text-muted-foreground mt-1">決済完了後に自動で表示されます</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {orders.map(order => (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    order.status === 'picked_up'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                    {order.status === 'picked_up'
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : <Clock className="w-5 h-5 text-amber-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">
                      {order.bag_title || '商品'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ¥{order.final_price.toLocaleString()} ·{' '}
                      {order.status === 'picked_up' ? '受取済' : '受取待ち'}
                    </p>
                  </div>
                  {order.pickup_code && (
                    <div className="shrink-0 text-right">
                      <p className="font-black font-mono text-primary tracking-widest text-sm">
                        {order.pickup_code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">受取コード</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

// ── メインコンポーネント ────────────────────────────────────────
export default function StoreOwnerDashboard() {
  const { user, profile, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [store, setStore] = useState<StoreRecord | null | undefined>(undefined); // undefined=loading

  useEffect(() => {
    if (!user) {
      setStore(null);
      return;
    }
    supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => setStore(data as StoreRecord | null));
  }, [user]);

  // ── ガード: ローディング中 ──
  if (isLoading || store === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ── ガード: 未ログイン ──
  if (!user) {
    return (
      <GuardScreen message="このページを表示するにはログインが必要です">
        <Link href="/login">
          <button className="mt-4 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            ログインする
          </button>
        </Link>
      </GuardScreen>
    );
  }

  // ── ガード: store_owner 以外はアクセス不可 ──
  if (profile && profile.role !== 'store_owner') {
    return (
      <GuardScreen message="このページは店舗オーナー専用です">
        <p className="text-sm text-muted-foreground mb-4">
          現在のアカウント役割: <span className="font-bold">{profile.role}</span>
        </p>
        <Link href="/">
          <button className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            ホームへ戻る
          </button>
        </Link>
      </GuardScreen>
    );
  }

  // ── 店舗未登録: 登録フォームを表示 ──
  if (store === null) {
    return (
      <StoreRegistrationForm
        userId={user.id}
        onRegistered={(newStore) => setStore(newStore)}
      />
    );
  }

  // ── 本体ダッシュボード ──
  return <Dashboard store={store} userId={user.id} />;
}
