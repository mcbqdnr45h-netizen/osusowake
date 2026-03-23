import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export type MyStore = {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review' | 'applied';
  ownerId: string | null;
  stripeAccountId: string | null;
};

export function useMyStore() {
  const { user, isLoading: authLoading } = useAuth();
  const [store, setStore] = useState<MyStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchStore = useCallback(() => {
    if (!user) {
      setStore(null);
      setFetchError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(false);
    fetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(user.id)}`, {
      cache: 'no-store',
    })
      .then(r => {
        if (r.ok) return r.json();
        if (r.status === 404) return null;
        throw new Error(`API error: ${r.status}`);
      })
      .then(data => {
        setStore(data ?? null);
        setFetchError(false);
      })
      .catch(err => {
        console.error('[useMyStore] fetch error:', err);
        setFetchError(true);
        setStore(null);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchStore();
  }, [user, authLoading, fetchStore]);

  const isApprovedOwner =
    store?.status === 'approved' && !!store?.stripeAccountId;

  const needsBankSetup =
    store?.status === 'approved' && !store?.stripeAccountId;

  return { store, loading, fetchError, isApprovedOwner, needsBankSetup, refetch: fetchStore };
}
