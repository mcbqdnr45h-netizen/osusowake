import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users } from 'lucide-react';

const BASE = (((import.meta as never as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) || '') ||
             (import.meta.env.BASE_URL?.replace(/\/$/, '') || '');

type GlobalImpact = {
  totalRescued: number;
  totalCo2Kg: number;
  totalFoodKg: number;
  totalSavedYen: number;
  totalUsers: number;
  totalStores: number;
};

const STORAGE_KEY = 'osusowake_impact_cache_v1';

function readCache(): GlobalImpact | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GlobalImpact;
  } catch {
    return null;
  }
}

function writeCache(data: GlobalImpact) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

export function LiveImpactCounter() {
  const [data, setData] = useState<GlobalImpact | null>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/api/impact/global`)
      .then(r => (r.ok ? r.json() : null))
      .then((j: GlobalImpact | null) => {
        if (!cancelled && j) { setData(j); writeCache(j); }
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, []);

  if (!data || data.totalRescued === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 py-3 relative">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
        <div className="absolute -right-8 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/85 text-[10px] font-bold leading-tight">みんなで救った食</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-white text-2xl font-black leading-none tabular-nums">
                {data.totalRescued.toLocaleString('ja-JP')}
              </span>
              <span className="text-white/90 text-xs font-bold">食</span>
              <span className="text-white/70 text-[10px] font-bold ml-1">
                · CO₂ {data.totalCo2Kg.toLocaleString('ja-JP')}kg 削減
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-white/85 text-[10px] font-bold">
              <Users className="w-3 h-3" />
              {data.totalUsers.toLocaleString('ja-JP')}
            </div>
            <p className="text-white/70 text-[9px] font-bold mt-0.5">参加中</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
