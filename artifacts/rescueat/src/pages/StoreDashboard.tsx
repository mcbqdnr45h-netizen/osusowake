import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { 
  useListStoreBags, 
  useListReservations, 
  useCreateBag, 
  useUpdateReservationStatus 
} from '@workspace/api-client-react';
import { Plus, Check, Store as StoreIcon, RefreshCw, Box, Leaf } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getStoreEcoRank, getStoreProgress } from '@/lib/eco-rank';

export default function StoreDashboard() {
  const STORE_ID = 1;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'reservations' | 'bags'>('reservations');
  const [isCreating, setIsCreating] = useState(false);

  const { data: bags, isLoading: isLoadingBags } = useListStoreBags(STORE_ID);
  const { data: reservations, isLoading: isLoadingRes } = useListReservations({ storeId: STORE_ID });
  
  const createBag = useCreateBag();
  const updateResStatus = useUpdateReservationStatus();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: 1000,
    discountedPrice: 300,
    stockCount: 5,
    pickupStart: '18:00',
    pickupEnd: '20:00'
  });

  const discountPercent = formData.originalPrice > 0 ? Math.round((1 - formData.discountedPrice / formData.originalPrice) * 100) : 0;

  const pickedUpCount = reservations?.filter(r => r.status === 'picked_up').length ?? 0;
  const co2Saved = +(pickedUpCount * 2.5).toFixed(1);
  const ecoRank = getStoreEcoRank(co2Saved);
  const progress = getStoreProgress(co2Saved, ecoRank);

  const handleCreateBag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBag.mutateAsync({
        storeId: STORE_ID,
        data: formData
      });
      toast({ title: "出品しました！" });
      setIsCreating(false);
      setFormData({ ...formData, title: '', description: '' });
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
      <div className="max-w-3xl mx-auto py-8 px-4">
        
        {/* Store header */}
        <div className="flex items-center gap-4 mb-5 bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black">デモ店舗: 渋谷ベーカリー 幸福堂</h1>
            <p className="text-sm text-muted-foreground font-medium">爆速の商品掲載フロー デモ</p>
          </div>
        </div>

        {/* Eco rank section */}
        <div className={`border-2 rounded-2xl p-5 mb-5 shadow-sm transition-all duration-500 ${ecoRank.sectionBg} ${ecoRank.sectionBorder}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${ecoRank.badgeBg} ${ecoRank.badgeText}`}>
              <span className="text-base leading-none">{ecoRank.icon}</span>
              {ecoRank.label}
            </div>
            <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${ecoRank.valueBg} ${ecoRank.labelText}`}>
              Lv.{ecoRank.rank}
            </div>
          </div>

          <div className="flex items-end gap-1 mb-1">
            <Leaf className={`w-6 h-6 mb-1 ${ecoRank.valueText}`} />
            <span className={`text-4xl font-black leading-none ${ecoRank.valueText}`}>{co2Saved}</span>
            <span className={`text-base font-bold mb-0.5 ${ecoRank.labelText}`}>kg</span>
            <span className={`text-xs font-bold mb-1 ml-1 ${ecoRank.labelText}`}>累計CO2削減</span>
          </div>

          <p className={`text-[10px] font-bold ${ecoRank.labelText}`}>
            {pickedUpCount}食をレスキュー済み（1食 = 2.5kg換算）
          </p>

          {ecoRank.rank < 3 && (
            <div className="mt-3">
              <div className={`w-full h-2 rounded-full ${ecoRank.rank === 1 ? 'bg-green-200 dark:bg-green-800' : 'bg-emerald-300 dark:bg-emerald-700'} overflow-hidden`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${ecoRank.progressColor}`}
                  style={{ width: `${Math.max(4, progress)}%` }}
                />
              </div>
              <p className={`text-[10px] font-bold mt-1.5 ${ecoRank.labelText}`}>{ecoRank.sublabel}</p>
            </div>
          )}
          {ecoRank.rank === 3 && (
            <p className={`text-xs font-bold mt-2 ${ecoRank.labelText}`}>{ecoRank.sublabel}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-muted p-1 rounded-xl mb-6 shadow-inner">
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'reservations' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('reservations')}
          >
            予約管理
          </button>
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'bags' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('bags')}
          >
            出品・在庫
          </button>
        </div>

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black mb-4">本日の受取予定</h2>
            
            {isLoadingRes ? (
              <div className="h-32 bg-card rounded-2xl animate-pulse" />
            ) : !reservations?.length ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-card">
                予約はまだありません
              </div>
            ) : (
              <div className="grid gap-4">
                {reservations.filter(r => r.status === 'confirmed').map(res => (
                  <div key={res.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-secondary text-secondary-foreground font-mono px-3 py-1 rounded-md text-sm font-black tracking-widest border border-border">
                          {res.pickupCode}
                        </span>
                        <span className="text-muted-foreground text-sm font-bold bg-muted px-2 py-1 rounded">
                          {res.bag?.pickupStart} - {res.bag?.pickupEnd}
                        </span>
                      </div>
                      <div className="font-bold text-lg">{res.bag?.title} <span className="text-primary font-black ml-2">× {res.quantity}</span></div>
                    </div>
                    <button 
                      onClick={() => handleCompletePickup(res.id)}
                      disabled={updateResStatus.isPending}
                      className="bg-primary text-primary-foreground font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                    >
                      <Check className="w-5 h-5" />
                      受渡完了にする
                    </button>
                  </div>
                ))}
                {reservations.filter(r => r.status === 'confirmed').length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border-2 border-dashed border-border flex flex-col items-center">
                    <Check className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    未処理の予約はありません
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bags' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black">出品中のバッグ</h2>
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="bg-foreground text-background font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-foreground/90 transition-all shadow-md active:scale-95"
              >
                {isCreating ? 'キャンセル' : <><Plus className="w-4 h-4" /> 新規出品</>}
              </button>
            </div>

            {isCreating && (
              <form onSubmit={handleCreateBag} className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <h3 className="font-black text-lg mb-4 text-foreground">新規出品フォーム</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">商品名</label>
                    <input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 placeholder:font-normal" placeholder="例: 本日のパン詰め合わせ" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">通常価格</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">¥</span>
                        <input type="number" required value={formData.originalPrice} onChange={e=>setFormData({...formData, originalPrice: Number(e.target.value)})} className="w-full bg-background border border-input rounded-xl pl-8 pr-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">割引価格</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">¥</span>
                        <input type="number" required value={formData.discountedPrice} onChange={e=>setFormData({...formData, discountedPrice: Number(e.target.value)})} className="w-full bg-background border-2 border-primary/30 rounded-xl pl-8 pr-4 py-3 font-black text-primary focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  {discountPercent > 0 && (
                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex justify-between items-center text-sm font-bold text-accent-foreground">
                      <span>割引率プレビュー</span>
                      <span className="text-xl text-accent bg-accent/20 px-3 py-1 rounded-lg">{discountPercent}% OFF</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">在庫数</label>
                    <div className="flex items-center w-32 bg-background border border-input rounded-xl overflow-hidden h-12">
                      <button type="button" onClick={() => setFormData({...formData, stockCount: Math.max(1, formData.stockCount - 1)})} className="w-10 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl">-</button>
                      <input type="number" required min="1" value={formData.stockCount} onChange={e=>setFormData({...formData, stockCount: Number(e.target.value)})} className="flex-1 text-center font-bold text-lg bg-transparent border-none focus:ring-0 p-0" />
                      <button type="button" onClick={() => setFormData({...formData, stockCount: formData.stockCount + 1})} className="w-10 h-full flex items-center justify-center bg-secondary hover:bg-secondary/80 font-bold text-xl">+</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">受取開始</label>
                      <input type="time" required value={formData.pickupStart} onChange={e=>setFormData({...formData, pickupStart: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-muted-foreground mb-1.5">受取終了</label>
                      <input type="time" required value={formData.pickupEnd} onChange={e=>setFormData({...formData, pickupEnd: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">説明文 (任意)</label>
                    <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-input rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none" rows={2} placeholder="アレルギー情報や商品の詳細などを記載" />
                  </div>
                </div>

                <button type="submit" disabled={createBag.isPending} className="w-full mt-6 bg-primary text-primary-foreground font-black text-lg py-4 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  {createBag.isPending ? <RefreshCw className="w-6 h-6 animate-spin" /> : '今すぐ出品する'}
                </button>
              </form>
            )}

            {isLoadingBags ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid gap-4">
                {bags?.map(bag => (
                  <div key={bag.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground text-lg truncate pr-2">{bag.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 font-medium">
                        <span className="bg-secondary px-2 py-1 rounded">受取: {bag.pickupStart} - {bag.pickupEnd}</span>
                        <span className={`px-2 py-1 rounded font-bold flex items-center gap-1 ${bag.stockCount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                          <Box className="w-3.5 h-3.5" />
                          在庫: {bag.stockCount}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{bag.description || '説明なし'}</div>
                    </div>
                    
                    <div className="flex items-end justify-between md:flex-col md:justify-center md:items-end bg-secondary/30 p-4 rounded-lg md:w-40 border border-border/50">
                      <span className="text-xs font-bold text-muted-foreground line-through decoration-destructive/50">¥{bag.originalPrice}</span>
                      <span className="font-black text-xl text-primary">¥{bag.discountedPrice}</span>
                    </div>
                  </div>
                ))}
                {!bags?.length && !isCreating && (
                  <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                    出品中のバッグはありません
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
