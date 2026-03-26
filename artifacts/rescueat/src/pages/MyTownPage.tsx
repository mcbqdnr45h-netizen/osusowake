import React from 'react';
import { Layout } from '@/components/Layout';
import { MyTown } from '@/components/MyTown';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';

export default function MyTownPage() {
  const userId = useUserId();

  const { data: reservations } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const pickedUpCount = reservations?.filter(r => r.status === 'picked_up').length ?? 0;

  return (
    <Layout showBottomNav>
      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        <h1 className="text-2xl font-black text-foreground mb-5 tracking-tight">
          🏘️ マイタウン
        </h1>
        <MyTown purchaseCount={pickedUpCount} />
      </div>
    </Layout>
  );
}
