import React from 'react';
import { Layout } from '@/components/Layout';
import { MyTown } from '@/components/MyTown';
import { useAuth } from '@/contexts/AuthContext';
import { useListReservations, getListReservationsQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';

export default function MyTownPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

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
        className="relative flex flex-col"
        style={{
          height: 'calc(100dvh - 64px - 64px)',
        }}
      >
        {/* 戻るボタン: ノッチ・Dynamic Island を避けた左上に固定 */}
        <button
          onClick={() => navigate('/mypage')}
          aria-label="マイページに戻る"
          className="absolute z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-foreground"
          style={{
            top: 'max(12px, env(safe-area-inset-top, 12px))',
            left: '16px',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <MyTown purchaseCount={pickedUpCount} fullPage />
      </div>
    </Layout>
  );
}
