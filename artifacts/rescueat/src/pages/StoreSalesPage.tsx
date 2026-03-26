import React from 'react';
import { StoreLayout } from '@/components/StoreLayout';
import { useMyStore } from '@/hooks/use-my-store';
import { useListReservations } from '@workspace/api-client-react';
import { BarChart2, TrendingUp, Package2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { isToday, parseISO, format, startOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Reservation {
  id: number;
  status: string;
  totalPrice: number;
  quantity: number;
  createdAt: string;
  bag: { title: string; discountedPrice: number } | null;
}

function groupByDay(reservations: Reservation[]) {
  const map: Record<string, number> = {};
  reservations
    .filter(r => r.status === 'picked_up')
    .forEach(r => {
      try {
        const day = format(parseISO(r.createdAt), 'M/d');
        map[day] = (map[day] ?? 0) + r.totalPrice;
      } catch {}
    });
  return Object.entries(map)
    .map(([date, revenue]) => ({ date, revenue }))
    .slice(-7);
}

export default function StoreSalesPage() {
  const { store, loading: storeLoading } = useMyStore();
  const storeId = store?.id ?? null;

  const { data: reservations = [], isLoading } = useListReservations(
    { storeId: storeId ?? 0 },
    { query: { enabled: !!storeId } }
  );

  if (storeLoading || isLoading) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      </StoreLayout>
    );
  }

  if (!store) {
    return (
      <StoreLayout>
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
            <p className="font-black text-lg">店舗情報が見つかりません</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const all = reservations as Reservation[];
  const pickedUp = all.filter(r => r.status === 'picked_up');
  const todayPickedUp = pickedUp.filter(r => { try { return isToday(parseISO(r.createdAt)); } catch { return false; } });
  const monthStart = startOfMonth(new Date());
  const monthPickedUp = pickedUp.filter(r => {
    try { return parseISO(r.createdAt) >= monthStart; } catch { return false; }
  });

  const totalRevenue   = pickedUp.reduce((sum, r) => sum + r.totalPrice, 0);
  const todayRevenue   = todayPickedUp.reduce((sum, r) => sum + r.totalPrice, 0);
  const monthRevenue   = monthPickedUp.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalBags      = pickedUp.reduce((sum, r) => sum + r.quantity, 0);

  const chartData = groupByDay(all);

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* ── ヘッダー ── */}
        <div>
          <h1 className="text-xl font-black text-foreground">売上確認</h1>
          <p className="text-xs text-muted-foreground mt-0.5">受取済みの注文のみ集計されます</p>
        </div>

        {/* ── サマリーカード ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '本日の売上',    value: `¥${todayRevenue.toLocaleString()}`,  icon: TrendingUp,  color: 'text-primary',    bg: 'bg-orange-50',  border: 'border-orange-100' },
            { label: '今月の売上',    value: `¥${monthRevenue.toLocaleString()}`,   icon: BarChart2,   color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
            { label: '累計売上',      value: `¥${totalRevenue.toLocaleString()}`,   icon: TrendingUp,  color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-100' },
            { label: '累計おすそわけ', value: `${totalBags}個`,                     icon: Package2,    color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-100'  },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`${item.bg} border ${item.border} rounded-2xl p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <p className="text-[10px] font-bold text-muted-foreground">{item.label}</p>
                </div>
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── 直近7日間の売上グラフ ── */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
            <h2 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              直近の日別売上
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `¥${v}`} />
                <Tooltip
                  formatter={(val: number) => [`¥${val.toLocaleString()}`, '売上']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #FFE4C4', fontSize: 12 }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? '#FF8C00' : '#FFD9A0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── 受取済み注文一覧 ── */}
        <div>
          <h2 className="text-base font-black text-foreground flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            受取済み注文
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full ml-1">
              {pickedUp.length}件
            </span>
          </h2>

          {pickedUp.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm font-bold text-foreground">まだ受取済みの注文がありません</p>
              <p className="text-xs text-muted-foreground mt-1">商品を出品して最初のおすそわけをしましょう</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...pickedUp].reverse().map(res => (
                <div key={res.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{res.bag?.title ?? '商品名なし'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(() => { try { return format(parseISO(res.createdAt), 'M月d日 HH:mm', { locale: ja }); } catch { return ''; } })()}
                      　×{res.quantity}個
                    </p>
                  </div>
                  <p className="text-sm font-black text-primary shrink-0">
                    ¥{res.totalPrice.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
