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

  const fetchStore = useCallback(() => {
    if (!user) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(user.id)}`, {
      cache: 'no-store',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setStore(data ?? null))
      .catch(() => setStore(null))
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

  return { store, loading, isApprovedOwner, needsBankSetup, refetch: fetchStore };
}
