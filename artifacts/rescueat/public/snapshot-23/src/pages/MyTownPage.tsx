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
      {/* ヘッダー(64px) + ボトムナビ(62px) + safe-area を引いた残り高さをフル使用 */}
      <div
        className="flex flex-col"
        style={{
          height: 'calc(100dvh - 64px - 64px)',
        }}
      >
        <MyTown purchaseCount={pickedUpCount} fullPage />
      </div>
    </Layout>
  );
}
