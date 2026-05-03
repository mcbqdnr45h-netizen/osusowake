import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { BagCard, BagCardSkeleton } from '@/components/BagCard';
import {
  useListAllBags,
  useListReservations,
  getListAllBagsQueryKey,
  getListReservationsQueryKey,
  SurpriseBagWithStore,
} from '@workspace/api-client-react';
import {
  Search, Store, MapPin, Zap, Flame, Moon, Navigation2,
  SlidersHorizontal, ChevronDown, X, PackageOpen, Loader2, Map as MapIcon,
  Globe, Clock, ArrowLeft, ShoppingBag, Megaphone, Star,
} from 'lucide-react';
import { NotificationsBell } from '@/components/NotificationsBell';
import { LiveImpactCounter } from '@/components/LiveImpactCounter';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIcon, getCategoryImage, normalizeCategory } from '@/lib/category-utils';
import { useMyStore } from '@/hooks/use-my-store';
import { useUserLocation, haversineMeters, requestGpsManually } from '@/hooks/use-user-location';
import { useUserId } from '@/hooks/use-user';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { loadGoogleMapsScript } from '@/lib/maps-loader';

// ─── 日次シードシャッフル ─────────────────────────────────────────────────
// 毎日異なる順番になるが、同じ日の中はリフレッシュしても同じ順番を維持する
function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = ((s * 1664525 + 1013904223) | 0) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── カテゴリーピル ────────────────────────────────────────────────────────
const SCROLL_CATS = [
  { label: 'すべて',        value: 'all',           emoji: '✨' },
  { label: '料理・お惣菜',  value: 'meals',          emoji: '🍱' },
  { label: 'パン・スイーツ', value: 'bakery_sweets', emoji: '🥐' },
  { label: '食材・その他',  value: 'ingredients',    emoji: '🍎' },
];

type SortKey = 'default' | 'time_asc' | 'price_asc' | 'price_desc';
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'おすすめ順',   value: 'default'    },
  { label: '時間が早い順', value: 'time_asc'   },
  { label: '価格が安い順', value: 'price_asc'  },
  { label: '価格が高い順', value: 'price_desc' },
];

// ─── 受け取り時間フォーマット ─────────────────────────────────────────────
function formatPickupTime(start?: string | null, end?: string | null): string {
  if (!start) return '';
  if (!end) return `${start}〜`;
  return `${start} 〜 ${end}`;
}

const ITEM_TYPE_OPTS = [
  { value: 'bag',  label: 'おすそわけ袋', emoji: '🛍' },
  { value: 'item', label: '単品商品',     emoji: '🥡' },
] as const;

// ─── カテゴリー＋商品タイプ統合ピル（1行横スクロール）───────────────────
function CategoryPills({
  activeCategory, onSelect,
  activeItemType, onSelectItemType,
}: {
  activeCategory: string;
  onSelect: (val: string) => void;
  activeItemType: 'all' | 'bag' | 'item';
  onSelectItemType: (val: 'all' | 'bag' | 'item') => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar px-4 pb-2 pt-1 items-center">
      {/* カテゴリーピル */}
      {SCROLL_CATS.map((cat) => {
        const isActive = activeCategory === cat.value;
        return (
          <motion.button
            key={cat.value}
            type="button"
            onClick={() => onSelect(isActive && cat.value !== 'all' ? 'all' : cat.value)}
            whileTap={{ scale: 0.92 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-foreground border-border hover:border-primary/40'
            }`}
          >
            <span className="text-sm leading-none">{cat.emoji}</span>
            <span>{cat.label}</span>
          </motion.button>
        );
      })}

      {/* 区切り線 */}
      <div className="w-px h-4 bg-border/60 shrink-0 mx-0.5" />

      {/* 商品タイプピル */}
      {ITEM_TYPE_OPTS.map((opt) => {
        const isActive = activeItemType === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onSelectItemType(isActive ? 'all' : opt.value)}
            whileTap={{ scale: 0.92 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-foreground border-border hover:border-primary/40'
            }`}
          >
            <span className="text-sm leading-none">{opt.emoji}</span>
            <span>{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}


// ─── セクション共通ヘッダー ────────────────────────────────────────────────
function SectionHeader({ icon, title, count }: {
  icon: React.ReactNode; title: string; count?: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 mb-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[13px] font-black text-foreground tracking-tight">{title}</span>
      </div>
      {count != null && (
        <span className="text-[10px] text-muted-foreground/70 font-bold bg-secondary px-1.5 py-0.5 rounded-full ml-1">
          {count}件
        </span>
      )}
    </div>
  );
}

// ─── 横スクロールラッパー ─────────────────────────────────────────────────
function HorizScrollRow({ bags, loading, skeletonCount = 4 }: {
  bags: SurpriseBagWithStore[];
  loading: boolean;
  skeletonCount?: number;
}) {
  if (!loading && bags.length === 0) return null;
  return (
    <div className="flex flex-row flex-nowrap overflow-x-auto hide-scrollbar gap-2 px-4 pb-1">
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} className="shrink-0 w-[160px]">
              <BagCardSkeleton compact />
            </div>
          ))
        : bags.map(bag => (
            <div key={String(bag.id)} className="shrink-0 w-[160px]">
              <BagCard bag={bag} compact />
            </div>
          ))
      }
      <div className="w-3 shrink-0" />
    </div>
  );
}

// ─── 全国モードバナー ─────────────────────────────────────────────────────
function NationwideBanner({ onAllow }: { onAllow: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="mx-4 mt-2.5 mb-0 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-3.5 py-2.5 flex items-center gap-3">
        <span className="text-xl select-none">🗾</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xs leading-tight">全国のおすそわけを表示中</p>
          <p className="text-white/75 text-[10px] mt-0.5 leading-tight">現在地をONにすると近くを優先表示</p>
        </div>
        <button onClick={onAllow}
          className="bg-white text-sky-600 font-black text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm tap-scale whitespace-nowrap">
          現在地ON
        </button>
      </div>
    </motion.div>
  );
}

// ─── フローティング地図ボタン ─────────────────────────────────────────────
// Home マウント時に idle で Google Maps script を先読み + FAB ホバー/タッチ時にも
// 念のため再トリガ。 これにより /map 遷移時にスクリプトが既にキャッシュ済みで
// 体感ロード時間を大幅短縮 (特に iOS WebView)。
function FloatingMapButton() {
  useEffect(() => {
    let cancelled = false;
    const trigger = () => { if (!cancelled) loadGoogleMapsScript().catch(() => { /* noop */ }); };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    const id: number = ric ? ric(trigger, { timeout: 2500 }) : window.setTimeout(trigger, 1500);
    return () => {
      cancelled = true;
      if (ric && cic) cic(id);
      else clearTimeout(id);
    };
  }, []);

  const prefetch = useCallback(() => {
    loadGoogleMapsScript().catch(() => { /* noop */ });
  }, []);

  return (
    <Link href="/map">
      <motion.button
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
        whileTap={{ scale: 0.88 }}
        onPointerEnter={prefetch}
        onTouchStart={prefetch}
        className="fixed right-4 z-40 w-14 h-14 bg-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)' }}
        aria-label="地図で探す"
      >
        <MapIcon className="w-6 h-6" />
      </motion.button>
    </Link>
  );
}

// ─── 位置情報フック (都市名) ──────────────────────────────────────────────
const GEO_TIMEOUT_MS = 5000;

function useUserCity() {
  const [city, setCity]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied]   = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); setDenied(true); return; }
    const fallbackTimer = setTimeout(() => { setLoading(false); setDenied(true); }, GEO_TIMEOUT_MS + 500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(fallbackTimer);
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`,
            { headers: { 'User-Agent': 'TabeRosu/1.0' }, signal: AbortSignal.timeout(4000) }
          );
          const data = await res.json();
          const addr = data.address || {};
          setCity(addr.city || addr.town || addr.village || addr.county || addr.state || null);
          setDenied(false);
        } catch { setCity(null); }
        finally { setLoading(false); }
      },
      () => { clearTimeout(fallbackTimer); setLoading(false); setDenied(true); },
      { timeout: GEO_TIMEOUT_MS, maximumAge: 600_000, enableHighAccuracy: false }
    );
    return () => clearTimeout(fallbackTimer);
  }, [retryCount]);

  const retry = useCallback(() => {
    setLoading(true); setDenied(false); setCity(null);
    setRetryCount(c => c + 1);
  }, []);

  return { city, loading, denied, retry };
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────
export default function Home() {
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showSearch,     setShowSearch]     = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeItemType, setActiveItemType] = useState<'all' | 'bag' | 'item'>('all');
  const [inStockOnly,    setInStockOnly]    = useState(true);  // デフォルトON
  const [sortKey,        setSortKey]        = useState<SortKey>('default');
  const [showSort,       setShowSort]       = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { settings: appSettings } = useAppSettings();
  const { toast } = useToast();

  // ── お知らせバナー ──
  const [announcement, setAnnouncement]         = useState<{ id: number; title: string; body: string } | null>(null);
  const [annDismissed, setAnnDismissed]         = useState(false);
  useEffect(() => {
    const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    fetch(`${BASE_URL}/api/announcements?limit=1`)
      .then(r => r.ok ? r.json() : [])
      .then((list: { id: number; title: string; body: string }[]) => {
        if (list.length > 0) {
          const key = `ann_dismissed_${list[0].id}`;
          if (!sessionStorage.getItem(key)) setAnnouncement(list[0]);
        }
      })
      .catch(() => {});
  }, []);

  const { user, profile, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { isApprovedOwner } = useMyStore();
  const userId = useUserId();
  const { data: bags, isLoading: isLoadingBags } = useListAllBags({
    query: { queryKey: getListAllBagsQueryKey(), refetchInterval: 60_000, staleTime: 30_000 },
  });

  // 未決済の予約を取得（仮押さえ廃止後は期限なし — 未払いのまま残る）
  // ゲスト UUID では予約は存在し得ない & サーバ側 requireAuth で 401 になるため
  // Supabase ログイン済み (user 取得済み) のときだけ fire させる。
  const { data: reservations } = useListReservations(
    { userId: user?.id || '' },
    { query: {
      queryKey: getListReservationsQueryKey({ userId: user?.id || '' }),
      enabled: !!user?.id, refetchInterval: 30_000, staleTime: 0,
    } },
  );
  const activeReservation = useMemo(() => {
    if (!reservations) return null;
    return reservations.find(r => r.status === 'pending' && r.paymentStatus !== 'paid') ?? null;
  }, [reservations]);
  const { city: userCity, loading: geoLoading, denied: geoDenied, retry: retryGeo } = useUserCity();
  const { coords: userCoords, loading: gpsLoading, denied: gpsDenied } = useUserLocation();

  // 「現在地ON」ボタン: GPS と都市名の両方を再取得
  // ブラウザ側で permission が denied のままだと再 prompt は出ない → ガイダンス表示
  const handleAllowLocation = useCallback(async () => {
    const coords = await requestGpsManually();
    if (coords) {
      // GPS 取得成功 → 都市名も再取得
      retryGeo();
    } else {
      // 拒否 or タイムアウト
      // Capacitor ネイティブアプリ (iOS/Android) かをまず判定 (iPadOS は UA で iPad を装わないため必須)
      const isNative = Capacitor.isNativePlatform();
      // iOS Safari/PWA 判定 (iPadOS は UA に "Mac" が入りタッチ端末になる為、補助的に touch も見る)
      const ua = navigator.userAgent;
      const isIosWeb = /iPad|iPhone|iPod/.test(ua) ||
                       (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      const description = isNative
        ? '「設定」→「おすそわけ」→「位置情報」を「このAppの使用中のみ許可」に変更してください'
        : isIosWeb
        ? '「設定」→「プライバシーとセキュリティ」→「位置情報サービス」→「Safari」を「このAppの使用中のみ許可」に変更してください'
        : 'ブラウザのアドレスバー左の鍵アイコンから位置情報を許可してください';
      toast({
        title: '位置情報が許可されていません',
        description,
        duration: 8000,
      });
    }
  }, [retryGeo, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (user && profile?.role === 'store_owner') {
      // 動的 import で循環依存回避
      import('@/lib/nav-debug').then(({ logNav }) => logNav('Home(store_owner on /)', '/store/dashboard'));
      navigate('/store/dashboard', { replace: true });
      return;
    }
  }, [authLoading, user, profile, navigate]);

  useEffect(() => {
    if (showSearch) { setTimeout(() => searchRef.current?.focus(), 80); }
    else { setSearchQuery(''); }
  }, [showSearch]);

  // 絞り込みモード: 検索・カテゴリ・商品タイプが変わった時のみ
  const isFiltering = searchQuery.trim() !== '' || activeCategory !== 'all' || activeItemType !== 'all';

  const allBags = bags || [];

  // 在庫フィルター + 商品タイプフィルターを適用したベースバッグ
  const visibleBags = useMemo(() => {
    let b = inStockOnly ? allBags.filter(b => b.stockCount > 0) : allBags;
    if (activeItemType !== 'all') b = b.filter(b => ((b as any).itemType ?? 'bag') === activeItemType);
    return b;
  }, [allBags, inStockOnly, activeItemType]);

  // ソート関数（各セクション・縦リスト共通）
  const applySortKey = useCallback((arr: SurpriseBagWithStore[]) => {
    if (sortKey === 'time_asc')   return [...arr].sort((a, b) => (a.pickupStart || '').localeCompare(b.pickupStart || ''));
    if (sortKey === 'price_asc')  return [...arr].sort((a, b) => a.discountedPrice - b.discountedPrice);
    if (sortKey === 'price_desc') return [...arr].sort((a, b) => b.discountedPrice - a.discountedPrice);
    return arr;
  }, [sortKey]);

  // ソート済みベース（セクション・全体グリッド共通で使う）
  const sortedVisibleBags = useMemo(() => applySortKey(visibleBags), [visibleBags, applySortKey]);

  // 絞り込み結果（縦リストモード専用 — 検索/カテゴリフィルター + ソート）
  const filteredBags = useMemo(() => {
    let result = visibleBags;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.store.name.toLowerCase().includes(q) ||
        b.store.city?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') result = result.filter(b => normalizeCategory(b.category) === activeCategory);
    return applySortKey(result);
  }, [visibleBags, searchQuery, activeCategory, applySortKey]);

  // 日次シードは1日中固定（ページリフレッシュしても同じ順番）
  const dailySeed = useMemo(() => getDailySeed(), []);

  // ── 現在時刻 (ms) を 60 秒ごとに更新 (もうすぐ終わるセクションの動的判定用) ──
  //   旧版は HH:MM 文字列比較だったため "02:00" < "23:59" の辞書順逆転で
  //   「23:59 終了の商品が 02:00 終了の商品より後ろになる」不具合が起きていた。
  //   完全に Date 演算 (ms) に統一して、 深夜跨ぎ・null (= 23:59 扱い) も厳密に処理する。
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 受付終了 "HH:MM" を「今からの残り時間 (ms)」に厳密変換
  //   ・null/不正/未設定 → その日の 23:59:59.999 として扱う (画面表示「23:59」と整合)
  //   ・終了時刻が「今」より過去なら翌日とみなして +1日 する (深夜跨ぎ)
  //   戻り値は常に >= 0 (= 受付終了までのミリ秒)
  const remainingMs = useCallback((end: string | null | undefined): number => {
    const now = new Date(nowMs);
    const target = new Date(now);
    const m = end?.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      target.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    } else {
      // 未設定 → 当日 23:59:59.999 として確実に拾う
      target.setHours(23, 59, 59, 999);
    }
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime() - now.getTime();
  }, [nowMs]);

  // ── ① もうすぐ終わるおすそわけ ──
  //   判定: 受付終了まで「0ms 以上 〜 180 分以内」
  //   並び: 「もうすぐ終わる」 セクションは sortKey に関係なく必ず残り時間が短い順で固定。
  //   (sortKey='time_asc' で applySortKey を使うと pickup_start の文字列比較になり
  //    "00:22" < "23:44" の辞書順で日跨ぎ商品が後ろに行ってしまう不具合を回避)
  const URGENT_WINDOW_MS = 180 * 60 * 1000;
  const urgentBags = useMemo(() => {
    const filtered = sortedVisibleBags.filter(b => {
      if (b.stockCount <= 0) return false;
      const rem = remainingMs(b.pickupEnd);
      return rem >= 0 && rem <= URGENT_WINDOW_MS;
    });
    return [...filtered]
      .sort((a, b) => remainingMs(a.pickupEnd) - remainingMs(b.pickupEnd))
      .slice(0, 8);
  }, [sortedVisibleBags, remainingMs]);

  // ── ② 今日のおすすめ ── デフォルト時は日次シードシャッフルで全店舗公平に露出
  const recommendedBags = useMemo(() => {
    const filtered = sortedVisibleBags.filter(b => b.stockCount > 0);
    if (sortKey === 'default') {
      return seededShuffle(filtered, dailySeed).slice(0, 8);
    }
    return applySortKey(filtered).slice(0, 8);
  }, [sortedVisibleBags, applySortKey, sortKey, dailySeed]);

  // ── ③ 現在地から近いお店 ── （距離順固定、ソート適用なし）
  const { nearbyBags, distMap } = useMemo(() => {
    if (!userCoords) return { nearbyBags: [], distMap: new Map<number, number>() };
    const map = new Map<number, number>();
    // 全バッグの距離を計算（座標あるものすべて）
    for (const b of visibleBags) {
      if (b.store.lat != null && b.store.lng != null) {
        map.set(b.id, haversineMeters(userCoords.lat, userCoords.lng, b.store.lat!, b.store.lng!));
      }
    }
    // nearbyBags: 在庫あり・近い順TOP8
    const withDist = visibleBags
      .filter(b => b.stockCount > 0 && b.store.lat != null && b.store.lng != null)
      .map(b => ({ bag: b, d: map.get(b.id)! }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map(x => x.bag);
    return { nearbyBags: withDist, distMap: map };
  }, [visibleBags, userCoords]);

  // ── ④ 今夜の受け取り（17:00〜翌02:00、深夜またぎ含む） ──
  const eveningBags = useMemo(
    () => applySortKey(sortedVisibleBags.filter(b => {
      const start = b.pickupStart || '';
      const end   = b.pickupEnd   || '';
      if (!start) return false;
      // 深夜またぎ（例: 22:00〜01:00）は必ず含める
      if (end && end < start) return true;
      // 通常: 開始が24:00以前 かつ 終了が17:00以降
      return start <= '23:59' && (!end || end >= '17:00');
    })).slice(0, 8),
    [sortedVisibleBags, applySortKey]
  );

  // ── ⑤⑥⑦ カテゴリー別 ──
  // sortKey が 'default' (おすすめ順) のときは日次シードでシャッフル、それ以外は applySortKey の順を尊重
  const mealsBags = useMemo(() => {
    const filtered = sortedVisibleBags.filter(b => normalizeCategory(b.category) === 'meals');
    if (sortKey === 'default') return seededShuffle(filtered, dailySeed + 1).slice(0, 10);
    return filtered.slice(0, 10);
  }, [sortedVisibleBags, sortKey, dailySeed]);
  const bakeryBags = useMemo(() => {
    const filtered = sortedVisibleBags.filter(b => normalizeCategory(b.category) === 'bakery_sweets');
    if (sortKey === 'default') return seededShuffle(filtered, dailySeed + 2).slice(0, 10);
    return filtered.slice(0, 10);
  }, [sortedVisibleBags, sortKey, dailySeed]);
  const ingredientBags = useMemo(() => {
    const filtered = sortedVisibleBags.filter(b => normalizeCategory(b.category) === 'ingredients');
    if (sortKey === 'default') return seededShuffle(filtered, dailySeed + 3).slice(0, 10);
    return filtered.slice(0, 10);
  }, [sortedVisibleBags, sortKey, dailySeed]);

  const activeFilterCnt = [activeCategory !== 'all', inStockOnly !== true].filter(Boolean).length;

  function clearAll() {
    setSearchQuery(''); setActiveCategory('all'); setActiveItemType('all'); setInStockOnly(true); setSortKey('default'); setShowSearch(false);
  }

  const dismissKeyboard = useCallback(() => {
    searchRef.current?.blur();
    setShowSort(false);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label || 'おすすめ順';

  if (authLoading) return null;

  const areaTitle = geoLoading
    ? '現在地を確認中...'
    : userCity
      ? `${userCity}のおすそわけ`
      : geoDenied ? '全国の注目おすそわけ' : (appSettings.catchphrase || 'あなたの街のおすそわけ');

  return (
    <Layout hideFooter>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Sticky ヘッダー ── */}
        <div className="shrink-0 bg-background border-b border-border/50 z-20 shadow-sm">

          {/* Row 1: エリア名 ←→ 🔔 + 検索アイコン */}
          <div className="flex items-center gap-2 px-4 h-11">
            <AnimatePresence mode="wait">
              {!showSearch ? (
                <motion.div key="area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 flex-1 min-w-0">
                  {geoLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                    : geoDenied
                      ? <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      : <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  }
                  <span className="text-sm font-black text-foreground truncate">{areaTitle}</span>
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef} type="search" inputMode="search"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    placeholder="お店・エリアで検索..."
                    className="w-full bg-secondary/60 border border-border text-foreground rounded-xl pl-8 pr-8 py-1.5 outline-none text-sm
                      focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 通知ベル（ログイン時のみ・検索時は非表示） */}
            {!showSearch && !!user && (
              <div className="shrink-0">
                <NotificationsBell />
              </div>
            )}

            {!showSearch ? (
              <button onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary/60 border border-border hover:bg-secondary tap-scale shrink-0"
                aria-label="検索">
                <Search className="w-4 h-4 text-foreground" />
              </button>
            ) : (
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="flex items-center gap-1 text-xs font-bold text-muted-foreground tap-scale shrink-0 ml-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            )}

            {isApprovedOwner && (
              <Link href="/store-dashboard" className="hidden md:block">
                <button className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-primary/90 tap-scale shadow-sm shrink-0">
                  <Store className="w-3.5 h-3.5" />ダッシュボード
                </button>
              </Link>
            )}
          </div>

          {/* Row 2: カテゴリー + 商品タイプ（1行統合） */}
          <CategoryPills
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            activeItemType={activeItemType}
            onSelectItemType={setActiveItemType}
          />

          {/* Row 3: フィルターバー */}
          <div className="flex items-center px-4 pb-2 gap-2">
            {/* 受付中のみトグル */}
            <button
              onClick={() => setInStockOnly(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tap-scale transition-colors shrink-0 ${
                inStockOnly
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className={`w-5 h-3 rounded-full flex items-center transition-colors ${inStockOnly ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`w-2 h-2 bg-white rounded-full shadow transition-transform mx-0.5 ${inStockOnly ? 'translate-x-2.5' : 'translate-x-0'}`} />
              </span>
              受付中のみ
            </button>

            {/* 並び替え */}
            <div className="relative">
              <button
                onClick={() => setShowSort(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border tap-scale transition-colors ${
                  sortKey !== 'default' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-muted-foreground border-border'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                {currentSortLabel}
                <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }} transition={{ duration: 0.13 }}
                    className="absolute top-full mt-1.5 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[148px]"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-secondary tap-opacity
                          ${sortKey === opt.value ? 'text-primary bg-primary/5' : 'text-foreground'}`}>
                        {sortKey === opt.value && <span className="mr-1">✓</span>}{opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />
            {isFiltering && <span className="text-xs text-muted-foreground font-medium">{filteredBags.length}件</span>}
            {(isFiltering || !inStockOnly || sortKey !== 'default') && (
              <motion.button onClick={clearAll} whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-destructive/8 text-destructive border border-destructive/20">
                <X className="w-3 h-3" />リセット
              </motion.button>
            )}
          </div>
        </div>

        {/* ── スクロールエリア ── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-secondary/10 scroll-smooth-native"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)',
            WebkitOverflowScrolling: 'touch',
          }}
          onTouchStart={dismissKeyboard}
          onClick={() => showSort && setShowSort(false)}
        >
          {/* ── ライブ救済カウンター（社会的証明 / 信頼感アップ） ── */}
          <LiveImpactCounter />

          {/* ── お知らせバナー ── */}
          <AnimatePresence>
            {announcement && !annDismissed && (
              <motion.div key="announcement-banner"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mx-3 mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-amber-800 leading-tight">{announcement.title}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed line-clamp-2">{announcement.body}</p>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.setItem(`ann_dismissed_${announcement.id}`, '1');
                    setAnnDismissed(true);
                  }}
                  className="shrink-0 p-1 rounded-full hover:bg-amber-100 transition-colors">
                  <X className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 未決済の予約バナー ── */}
          <AnimatePresence>
            {activeReservation && (
              <motion.button
                key="pending-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => navigate(`/checkout/${activeReservation.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold opacity-90">未決済の予約があります</p>
                  <p className="text-sm font-black truncate">
                    {activeReservation.bag?.title ?? 'おすそわけバッグ'}
                  </p>
                </div>
                <div className="text-xs font-bold opacity-80 shrink-0">決済へ →</div>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ─── 絞り込みモード ─── */}
            {isFiltering ? (
              <motion.div key="filtered"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 pt-3 pb-6"
              >
                {isLoadingBags ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} compact />)}
                  </div>
                ) : filteredBags.length > 0 ? (
                  <motion.div
                    key={`${activeCategory}-${searchQuery}`}
                    className="grid grid-cols-2 gap-2"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {filteredBags.map((bag, i) => (
                      <motion.div key={bag.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}>
                        <BagCard bag={bag} compact />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col items-center text-center px-6 py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-3">
                        <PackageOpen className="w-8 h-8 text-primary/60" />
                      </div>
                      <h3 className="text-base font-black text-foreground mb-1">
                        {activeItemType === 'item' && activeCategory !== 'all'
                          ? `「${SCROLL_CATS.find(c => c.value === activeCategory)?.label}」の単品商品はまだありません`
                          : activeItemType === 'item'
                            ? '単品商品はまだありません'
                            : activeCategory !== 'all'
                              ? `「${SCROLL_CATS.find(c => c.value === activeCategory)?.label}」のおすそわけはまだありません`
                              : '条件に合うおすそわけが見つかりませんでした'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">ジャンルや条件を変えて探してみてください</p>
                      <motion.button onClick={clearAll} whileTap={{ scale: 0.94 }}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/20">
                        <X className="w-3.5 h-3.5" />条件をリセット
                      </motion.button>
                    </div>
                    {visibleBags.length > 0 && (
                      <div className="mt-1 pb-2">
                        <div className="flex items-center gap-2 mb-3 px-4">
                          <div className="flex-1 h-px bg-border/60" />
                          <span className="text-[11px] font-black text-muted-foreground px-1">✨ 代わりにこちらはいかがですか？</span>
                          <div className="flex-1 h-px bg-border/60" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 px-4">
                          {visibleBags.slice(0, 4).map(bag => <BagCard key={bag.id} bag={bag} compact />)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

            ) : (
              /* ─── 通常ホーム（7セクション） ─── */
              <motion.div key="home"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pb-6"
              >
                {/* 全国モードバナー */}
                {!geoLoading && (geoDenied || gpsDenied) && <NationwideBanner onAllow={handleAllowLocation} />}

                {/* ① もうすぐ終わるおすそわけ */}
                {(isLoadingBags || urgentBags.length > 0) && (
                  <div className="pt-3 pb-2">
                    <SectionHeader
                      icon={<Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                      title="もうすぐ終わるおすそわけ"
                      count={!isLoadingBags ? urgentBags.length : undefined}
                    />
                    <HorizScrollRow bags={urgentBags.slice(0, 6)} loading={isLoadingBags} />
                  </div>
                )}

                {/* ② 今日のおすすめ */}
                {(isLoadingBags || recommendedBags.length > 0) && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                      title="今日のおすすめ"
                      count={!isLoadingBags ? recommendedBags.length : undefined}
                    />
                    <HorizScrollRow bags={recommendedBags.slice(0, 6)} loading={isLoadingBags} />
                  </div>
                )}

                {/* ③ 現在地から近いお店 */}
                {userCoords && nearbyBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Navigation2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      title="現在地から近いお店"
                      count={nearbyBags.length}
                    />
                    <HorizScrollRow bags={nearbyBags.slice(0, 6)} loading={false} />
                  </div>
                )}

                {/* ④ 今夜の受け取り */}
                {eveningBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      title="今夜の受け取り（17〜24時）"
                      count={eveningBags.length}
                    />
                    <HorizScrollRow bags={eveningBags.slice(0, 6)} loading={false} />
                  </div>
                )}

                {/* ⑤ 料理・お惣菜 */}
                {mealsBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🍱</span>}
                      title="料理・お惣菜"
                      count={mealsBags.length}
                    />
                    <HorizScrollRow bags={mealsBags} loading={false} />
                  </div>
                )}

                {/* ⑥ パン・スイーツ */}
                {bakeryBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🥐</span>}
                      title="パン・スイーツ"
                      count={bakeryBags.length}
                    />
                    <HorizScrollRow bags={bakeryBags} loading={false} />
                  </div>
                )}

                {/* ⑦ 食材・その他 */}
                {ingredientBags.length > 0 && (
                  <div className="pt-1 pb-2">
                    <SectionHeader
                      icon={<span className="text-sm leading-none">🍎</span>}
                      title="食材・その他"
                      count={ingredientBags.length}
                    />
                    <HorizScrollRow bags={ingredientBags} loading={false} />
                  </div>
                )}

                {/* 区切り & すべてのおすそわけ */}
                {!isLoadingBags && (
                  <>
                    <div className="mx-4 mt-2 mb-0 border-t border-border/40" />
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                      <span className="text-[13px] font-black text-foreground">すべてのおすそわけ</span>
                      <span className="text-[10px] text-muted-foreground">{sortedVisibleBags.length}件</span>
                      {sortKey !== 'default' && (
                        <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
                          {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* バッググリッド */}
                <div className="px-4">
                  {isLoadingBags ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map(i => <BagCardSkeleton key={i} compact />)}
                    </div>
                  ) : sortedVisibleBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-gradient-to-br from-primary/15 to-amber-200/40 rounded-3xl flex items-center justify-center mb-4"
                      >
                        <span className="text-4xl select-none">{geoDenied ? '🗾' : '🎁'}</span>
                      </motion.div>
                      <h3 className="text-base font-black text-foreground mb-1.5">
                        {inStockOnly ? '現在受付中のおすそわけはありません' : '今日のおすそわけを準備中'}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {inStockOnly
                          ? '「受付中のみ」をOFFにすると全商品を確認できます'
                          : 'お近くのお店がおすそわけを準備中です！'
                        }
                      </p>
                      {inStockOnly && (
                        <button onClick={() => setInStockOnly(false)}
                          className="px-5 py-2 bg-secondary text-foreground rounded-2xl text-sm font-bold border border-border">
                          すべて表示する
                        </button>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-2 gap-2"
                      initial="hidden" animate="show"
                      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    >
                      {sortedVisibleBags.map(bag => (
                        <motion.div key={bag.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                          <BagCard bag={bag} compact />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <FloatingMapButton />
    </Layout>
  );
}
