import React from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useListReservations } from '@workspace/api-client-react';
import { format, parseISO } from 'date-fns';
import { Ticket, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

export default function MyReservations() {
  const userId = useUserId();
  const { data: reservations, isLoading } = useListReservations({ userId: userId || '' }, {
    query: { enabled: !!userId }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md text-xs font-bold">予約確定</span>;
      case 'picked_up':
        return <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-xs font-bold">受取完了</span>;
      case 'cancelled':
        return <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-md text-xs font-bold">キャンセル</span>;
      default:
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold">未払い</span>;
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">マイ予約</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-bold text-foreground mb-2">まだ予約がありません</h2>
            <p className="text-muted-foreground mb-6 text-sm">気になるサプライズバッグを見つけて、<br/>フードロス削減に貢献しましょう！</p>
            <Link href="/">
              <a className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-full shadow-md shadow-primary/20 hover:shadow-lg transition-all inline-block">
                バッグを探す
              </a>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((res, i) => (
              <motion.div 
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-card rounded-2xl border overflow-hidden shadow-sm ${res.status === 'picked_up' || res.status === 'cancelled' ? 'border-border/50 opacity-70' : 'border-border hover:shadow-md transition-shadow'}`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image & Main Info */}
                  <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-muted-foreground">{format(parseISO(res.createdAt), 'yyyy/MM/dd')}</div>
                      {getStatusBadge(res.status)}
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{res.store?.name}</h3>
                    <p className="text-foreground mb-4 font-medium">{res.bag?.title} <span className="text-muted-foreground font-normal">× {res.quantity}</span></p>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>受取期間: <strong className="text-foreground">{res.bag?.pickupStart} - {res.bag?.pickupEnd}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{res.store?.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action / Code section */}
                  <div className="bg-secondary/30 p-5 sm:w-64 flex flex-col justify-center items-center text-center">
                    <div className="text-sm text-muted-foreground mb-1">お支払い金額</div>
                    <div className="text-2xl font-display font-bold text-foreground mb-4">¥{res.totalPrice.toLocaleString()}</div>
                    
                    {res.status === 'confirmed' && res.pickupCode ? (
                      <div className="w-full">
                        <div className="text-xs text-muted-foreground mb-1">店頭でこのコードを提示</div>
                        <div className="bg-background border-2 border-primary/20 text-primary font-mono font-bold text-xl py-3 rounded-xl tracking-widest">
                          {res.pickupCode}
                        </div>
                      </div>
                    ) : res.status === 'pending' ? (
                      <Link href={`/checkout/${res.id}`}>
                        <a className="w-full bg-foreground text-background font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors">
                          決済へ進む <ExternalLink className="w-4 h-4" />
                        </a>
                      </Link>
                    ) : (
                      <div className="text-sm font-medium text-muted-foreground">
                        {res.status === 'picked_up' ? '受け取りありがとうございました！' : 'この予約はキャンセルされました'}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
