import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { 
  useListStoreBags, 
  useListReservations, 
  useCreateBag, 
  useUpdateReservationStatus 
} from '@workspace/api-client-react';
import { Plus, Package, Check, Store as StoreIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function StoreDashboard() {
  const STORE_ID = 1; // Fixed for MVP purposes
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'bags' | 'reservations'>('reservations');
  const [isCreating, setIsCreating] = useState(false);

  const { data: bags, isLoading: isLoadingBags } = useListStoreBags(STORE_ID);
  const { data: reservations, isLoading: isLoadingRes } = useListReservations({ storeId: STORE_ID });
  
  const createBag = useCreateBag();
  const updateResStatus = useUpdateReservationStatus();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: 1000,
    discountedPrice: 300,
    stockCount: 5,
    pickupStart: '18:00',
    pickupEnd: '20:00'
  });

  const handleCreateBag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBag.mutateAsync({
        storeId: STORE_ID,
        data: formData
      });
      toast({ title: "出品しました" });
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/stores/1/bags'] });
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    }
  };

  const handleCompletePickup = async (reservationId: number) => {
    try {
      await updateResStatus.mutateAsync({
        reservationId,
        data: { status: 'picked_up' }
      });
      toast({ title: "受取を完了しました" });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    } catch (err: any) {
      toast({ title: "エラー", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        
        <div className="flex items-center gap-3 mb-8 bg-primary/10 border border-primary/20 p-4 rounded-2xl text-primary">
          <StoreIcon className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold">店舗管理ダッシュボード</h1>
            <p className="text-sm opacity-80">Store ID: {STORE_ID} (MVP用モック店舗)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted p-1 rounded-xl mb-6 max-w-sm">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'reservations' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('reservations')}
          >
            予約管理
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'bags' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('bags')}
          >
            出品・在庫
          </button>
        </div>

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold mb-4">本日の受取予定</h2>
            
            {isLoadingRes ? (
              <div className="h-32 bg-card rounded-2xl animate-pulse" />
            ) : !reservations?.length ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                予約はまだありません
              </div>
            ) : (
              <div className="grid gap-4">
                {reservations.filter(r => r.status === 'confirmed').map(res => (
                  <div key={res.id} className="bg-card border-l-4 border-l-primary border-y border-r border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-secondary text-secondary-foreground font-mono px-2 py-0.5 rounded text-sm font-bold">
                          {res.pickupCode}
                        </span>
                        <span className="text-muted-foreground text-sm">時間: {res.bag?.pickupStart} - {res.bag?.pickupEnd}</span>
                      </div>
                      <div className="font-bold text-lg">{res.bag?.title} <span className="text-muted-foreground font-normal">× {res.quantity}</span></div>
                    </div>
                    <button 
                      onClick={() => handleCompletePickup(res.id)}
                      disabled={updateResStatus.isPending}
                      className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      <Check className="w-5 h-5" />
                      受渡完了にする
                    </button>
                  </div>
                ))}

                {reservations.filter(r => r.status === 'confirmed').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border flex flex-col items-center">
                    <Check className="w-10 h-10 text-muted-foreground/30 mb-2" />
                    未処理の予約はありません
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bags' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">出品中のバッグ</h2>
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="bg-foreground text-background font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-foreground/90 transition-colors"
              >
                {isCreating ? 'キャンセル' : <><Plus className="w-4 h-4" /> 新規出品</>}
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateBag} className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">タイトル</label>
                    <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="例: パン詰め合わせセット" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-1">説明 (任意)</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">通常価格 (¥)</label>
                    <input type="number" required value={formData.originalPrice} onChange={e=>setFormData({...formData, originalPrice: Number(e.target.value)})} className="w-full bg-background border border-input rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">割引価格 (¥)</label>
                    <input type="number" required value={formData.discountedPrice} onChange={e=>setFormData({...formData, discountedPrice: Number(e.target.value)})} className="w-full bg-background border border-input rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">出品数</label>
                    <input type="number" required min="1" value={formData.stockCount} onChange={e=>setFormData({...formData, stockCount: Number(e.target.value)})} className="w-full bg-background border border-input rounded-xl px-4 py-2" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">受取開始</label>
                      <input type="time" required value={formData.pickupStart} onChange={e=>setFormData({...formData, pickupStart: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-2" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">受取終了</label>
                      <input type="time" required value={formData.pickupEnd} onChange={e=>setFormData({...formData, pickupEnd: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-2" />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={createBag.isPending} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center shadow-md">
                  {createBag.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : '出品する'}
                </button>
              </form>
            )}

            {isLoadingBags ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bags?.map(bag => (
                  <div key={bag.id} className="bg-card border border-border rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-foreground text-lg truncate pr-2">{bag.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${bag.stockCount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        残り {bag.stockCount}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-1">{bag.description}</div>
                    
                    <div className="mt-auto flex items-end justify-between bg-secondary/30 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground">
                        {bag.pickupStart} - {bag.pickupEnd}
                      </div>
                      <div className="text-right">
                        <span className="text-xs line-through mr-2">¥{bag.originalPrice}</span>
                        <span className="font-bold text-lg text-foreground">¥{bag.discountedPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
