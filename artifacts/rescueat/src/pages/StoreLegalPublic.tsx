import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import { ChevronLeft, Scale, Building2, User, MapPin, Phone, Mail, FileText } from 'lucide-react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

type LegalInfo = {
  name: string;
  legalName: string | null;
  legalRepresentative: string | null;
  legalAddress: string | null;
  legalPhone: string | null;
  legalEmail: string | null;
  legalOther: string | null;
};

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-4 border-b border-border/50 last:border-0">
      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
}

export default function StoreLegalPublic() {
  const [, params] = useRoute('/stores/:id/legal');
  const storeId = params?.id;
  const [, navigate] = useLocation();

  const [info, setInfo] = useState<LegalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetch(`${BASE}/api/stores/${storeId}/legal`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setInfo(data); })
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-foreground">特定商取引法に基づく表記</h1>
            {info && <p className="text-xs text-muted-foreground">{info.name}</p>}
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="font-black text-base">販売事業者情報</h2>
          </div>

          {notFound || (!loading && !info) ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Scale className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">特商法表記が未設定です</p>
              <p className="text-sm text-muted-foreground mt-1">この店舗はまだ情報を登録していません</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl px-5 py-2 shadow-sm">
              <Row icon={Building2} label="販売事業者名" value={info?.legalName ?? null} />
              <Row icon={User} label="代表者名" value={info?.legalRepresentative ?? null} />
              <Row icon={MapPin} label="所在地" value={info?.legalAddress ?? null} />
              <Row icon={Phone} label="電話番号" value={info?.legalPhone ?? null} />
              <Row icon={Mail} label="メールアドレス" value={info?.legalEmail ?? null} />
              <Row icon={FileText} label="返品・その他" value={info?.legalOther ?? null} />
              {!info?.legalName && !info?.legalRepresentative && !info?.legalAddress && (
                <div className="py-8 text-center text-muted-foreground text-sm">情報が登録されていません</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
