import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const CACHE_KEY_PREFIX = 'osusowake_myStores_v1_';
const SELECTED_STORE_KEY_PREFIX = 'osusowake_selectedStore_v1_';

export type MyStore = {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review' | 'applied';
  isActive: boolean;
  ownerId: string | null;
  stripeAccountId: string | null;
  stripeChargesEnabled: boolean | null;
  stripePayoutsEnabled: boolean | null;
  stripeNeedsBankReregister: boolean | null;
  imageUrl: string | null;
  description: string | null;
  openTime: string | null;
  closeTime: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  category: string | null;
  holiday: string | null;
  pickupHours: string | null;
  rejectionReason: string | null;
  licenseImageUrl: string | null;
  licenseNumber: string | null;
  totalBagsAvailable?: number;
};

function cacheKey(userId: string) { return `${CACHE_KEY_PREFIX}${userId}`; }
function selectedKey(userId: string) { return `${SELECTED_STORE_KEY_PREFIX}${userId}`; }

function readCache(userId: string): MyStore[] {
  try { const raw = localStorage.getItem(cacheKey(userId)); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function writeCache(userId: string, stores: MyStore[]) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(stores)); } catch {}
}
function readSelectedStoreId(userId: string): number | null {
  try { const v = Number(localStorage.getItem(selectedKey(userId))); return isNaN(v) ? null : v; }
  catch { return null; }
}
function writeSelectedStoreId(userId: string, storeId: number | null) {
  try {
    if (storeId !== null) localStorage.setItem(selectedKey(userId), String(storeId));
    else localStorage.removeItem(selectedKey(userId));
  } catch {}
}

interface MyStoresContextValue {
  stores: MyStore[];
  currentStore: MyStore | null;
  selectedStoreId: number | null;
  setSelectedStoreId: (id: number | null) => void;
  loading: boolean;
  fetchError: boolean;
  refetch: () => void;
  isApprovedOwner: boolean;
  needsBankSetup: boolean;
  hasExistingStripeAccount: boolean;
}

const MyStoresContext = createContext<MyStoresContextValue | null>(null);

export function MyStoresProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  const [stores, setStores] = useState<MyStore[]>(() => user ? readCache(user.id) : []);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedStoreId, setSelectedStoreIdState] = useState<number | null>(
    () => user ? readSelectedStoreId(user.id) : null
  );

  const setSelectedStoreId = useCallback((id: number | null) => {
    setSelectedStoreIdState(id);
    if (user) writeSelectedStoreId(user.id, id);
  }, [user]);

  const fetchStores = useCallback(() => {
    if (!user) {
      setStores([]); setFetchError(false); setLoading(false);
      return;
    }
    const uid = user.id;
    setLoading(true); setFetchError(false);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    fetch(`${BASE}/api/stores/all-by-owner?userId=${encodeURIComponent(uid)}`, { cache: 'no-store' })
      .then(r => {
        if (r.ok) return r.json() as Promise<MyStore[]>;
        if (r.status === 404) return [] as MyStore[];
        throw new Error(`API error: ${r.status}`);
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStores(list);
        writeCache(uid, list);
        setFetchError(false);
        setSelectedStoreIdState(prev => {
          if (prev && list.some(s => s.id === prev)) return prev;
          const first = list[0]?.id ?? null;
          writeSelectedStoreId(uid, first);
          return first;
        });
      })
      .catch(err => {
        console.warn('[MyStoresContext] fetch error (retry in 4s):', err);
        setFetchError(true);
        retryTimerRef.current = setTimeout(fetchStores, 4000);
      })
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const cached = readCache(user.id);
      setStores(cached);
      const savedId = readSelectedStoreId(user.id);
      setSelectedStoreIdState(savedId ?? cached[0]?.id ?? null);
    } else {
      setStores([]);
      setSelectedStoreIdState(null);
    }
    fetchStores();
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, [user, authLoading, fetchStores]);

  const currentStore = stores.find(s => s.id === selectedStoreId) ?? stores[0] ?? null;
  const isApprovedOwner = currentStore?.status === 'approved' && !!currentStore?.stripeAccountId;
  const needsBankSetup = currentStore?.status === 'approved' && !currentStore?.stripeAccountId;
  const hasExistingStripeAccount = stores.some(s => !!s.stripeAccountId);

  return (
    <MyStoresContext.Provider value={{
      stores, currentStore, selectedStoreId, setSelectedStoreId,
      loading, fetchError, refetch: fetchStores,
      isApprovedOwner, needsBankSetup, hasExistingStripeAccount,
    }}>
      {children}
    </MyStoresContext.Provider>
  );
}

export function useMyStoresContext() {
  const ctx = useContext(MyStoresContext);
  if (!ctx) throw new Error('useMyStoresContext must be used within MyStoresProvider');
  return ctx;
}
