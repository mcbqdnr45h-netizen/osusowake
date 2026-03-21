import { useEffect, useState } from 'react';
import { useUserId } from '@/hooks/use-user';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export type MyStore = {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'pending_review';
  ownerId: string | null;
};

export function useMyStore() {
  const userId = useUserId();
  const [store, setStore] = useState<MyStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${BASE}/api/stores/by-owner?userId=${encodeURIComponent(userId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setStore(data ?? null))
      .catch(() => setStore(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const isApprovedOwner = store?.status === 'approved';

  return { store, loading, isApprovedOwner };
}
