import React from 'react';
import { Layout } from '@/components/Layout';
import { MyTown } from '@/components/MyTown';
import { useAuth } from '@/contexts/AuthContext';
import { useListReservations, getListReservationsQueryKey } from '@workspace/api-client-react';

export default function MyTownPage() {
  // ゲスト UUID では予約は存在しない & サーバ側 requireAuth で 401 になるため
  // Supabase ログイン済み (user 取得済み) のときだけ fire させる。
  const { user } = useAuth();

  const { data: reservations } = useListReservations({ userId: user?.id || '' }, {
    query: {
      queryKey: getListReservationsQueryKey({ userId: user?.id || '' }),
      enabled: !!user?.id,
    },
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
