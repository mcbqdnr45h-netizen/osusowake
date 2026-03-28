import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { StoreLayout } from '@/components/StoreLayout';
import { useUserId } from '@/hooks/use-user';
import { useLocation, Link } from 'wouter';
import {
  ChevronLeft, User, Camera, Bell, LogOut,
  ChevronRight, Mail, Pencil, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const GENRES = ['ベーカリー', 'お弁当', 'カフェ', 'レストラン', 'スーパー', 'コンビニ', 'スイーツ', '和食'];

function TokushoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-0 md:px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[85dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-black">特定商取引法に基づく表記</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto overflow-x-hidden px-6 py-5 space-y-5">
          {[
            { label: '販売業者', value: 'OsusOwake 事務局' },
            { label: '運営責任者', value: 'Yuhi' },
            { label: 'お問い合わせ', value: (
              <a href="https://forms.gle/uhMoXjjF9YzkR52a6" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Googleフォームよりお問い合わせください
              </a>
            )},
            { label: 'サービス内容', value: 'フードロス削減を目的とした飲食店・食料品店のおすそわけバッグ予約・購入プラットフォーム' },
            { label: '販売価格', value: '各商品ページに表示の価格（税込）' },
            { label: '支払方法', value: 'クレジットカード（Stripe決済）' },
            { label: '支払時期', value: '予約確定時に即時決済' },
            { label: '商品の引渡し時期', value: '各店舗の受取時間内にご来店の上、お受け取りください' },
            { label: 'キャンセル・返品規定', value: '商品の性質上、購入確定後のキャンセル・返品・交換はお受けできません。ただし、店舗側の都合による商品提供不可の場合は全額返金いたします。' },
            { label: '手数料', value: '初期費用・月額費用：0円。販売成立時のみ、販売金額の25%を手数料として申し受けます。' },
            { label: '個人情報の取扱い', value: '収集した個人情報は、サービス提供・改善の目的のみに使用し、第三者への提供は行いません。' },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <dt className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">{label}</dt>
              <dd className="text-sm text-foreground leading-relaxed">{value}</dd>
            </div>
          ))}
        </div>
        <div className="shrink-0 px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            閉じる
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function useLocalSettings(userId: string) {
  const key = `rescueat_settings_${userId}`;
  const raw = localStorage.getItem(key);
  const defaults = {
    displayName: 'ゲストユーザー',
    email: '',
    favoriteGenres: [] as string[],
    avatarColor: '#2D5A51',
    notifNewListing: true,
    notifFavoriteUpdate: true,
    notifPoints: false,
  };
  const saved = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  function save(patch: Partial<typeof defaults>) {
    const next = { ...saved, ...patch };
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  }
  return { saved, save };
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none
        ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 mb-2 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function Row({
  icon, iconBg = 'bg-secondary', label, sublabel, right, onClick, danger = false,
}: {
  icon: React.ReactNode; iconBg?: string; label: string; sublabel?: string;
  right?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 min-h-[56px] transition-colors
        ${onClick ? (danger ? 'hover:bg-destructive/5 active:bg-destructive/10' : 'hover:bg-secondary/60 active:bg-secondary') : ''}
        ${danger ? 'text-destructive' : 'text-foreground'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`font-bold text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {right ?? (onClick && !danger ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /> : null)}
    </Tag>
  );
}

function SettingsWrapper({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role === 'store_owner') {
    return <StoreLayout>{children}</StoreLayout>;
  }
  return <Layout showBottomNav={false}>{children}</Layout>;
}

export default function Settings() {
  const userId = useUserId() || '';
  const { user, profile, signOut: authSignOut, refreshProfile } = useAuth();
  const isStoreOwner = profile?.role === 'store_owner';
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { saved, save } = useLocalSettings(userId);

  // display_name は Supabase から。fallback: メールの@前
  const initialDisplayName =
    profile?.display_name ||
    user?.email?.split('@')[0] ||
    saved.displayName ||
    'ゲストユーザー';

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [email, setEmail] = useState(user?.email ?? saved.email);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(saved.favoriteGenres);
  const [notifNewListing, setNotifNewListing] = useState(saved.notifNewListing);
  const [notifFavoriteUpdate, setNotifFavoriteUpdate] = useState(saved.notifFavoriteUpdate);
  const [notifPoints, setNotifPoints] = useState(saved.notifPoints);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saved_, setSaved_] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showTokusho, setShowTokusho] = useState(false);

  // profile が読み込まれたら display_name を同期
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
    if (user?.email) setEmail(user.email);
  }, [profile?.display_name, user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avatar initials
  const initials = displayName.trim().slice(0, 2) || 'GU';

  function toggleGenre(g: string) {
    setFavoriteGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  async function handleSaveProfile() {
    setSavingName(true);
    try {
      // ① display_name を Supabase に保存
      const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
      const token = session.data.session?.access_token;
      if (token && displayName.trim()) {
        const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
        const res = await fetch(`${base}/api/user/display-name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayName: displayName.trim() }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error || 'save failed');
        }
        await refreshProfile();
      }
      // ② その他の設定は localStorage に保存
      save({ displayName, email, favoriteGenres });
      setEditingProfile(false);
      setSaved_(true);
      setTimeout(() => setSaved_(false), 2000);
      toast({ title: '表示名を保存しました ✅' });
    } catch (err) {
      console.error('[Settings] saveDisplayName error:', err);
      toast({ title: '保存に失敗しました', description: String(err), variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  }

  function handleToggle(key: 'notifNewListing' | 'notifFavoriteUpdate' | 'notifPoints', val: boolean) {
    if (key === 'notifNewListing') setNotifNewListing(val);
    if (key === 'notifFavoriteUpdate') setNotifFavoriteUpdate(val);
    if (key === 'notifPoints') setNotifPoints(val);
    save({ [key]: val });
  }


  async function handleLogout() {
    await authSignOut();
    navigate('/welcome');
  }

  return (
    <SettingsWrapper>
      <AnimatePresence>
        {showTokusho && <TokushoModal onClose={() => setShowTokusho(false)} />}
      </AnimatePresence>
      <div className="max-w-md mx-auto pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(var(--layout-header-height, 0px) + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black text-foreground">アカウント設定</h1>
        </div>

        <div className="px-4 pt-4">

          {/* ── PROFILE ── */}
          <SectionLabel>プロフィール</SectionLabel>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-1">

            {/* Avatar row */}
            <div className="flex items-center gap-4 px-4 py-5 border-b border-border/60">
              <div className="relative shrink-0">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black shadow-md"
                  style={{ background: 'linear-gradient(135deg, #2D5A51, #4A8C7F)' }}
                >
                  {initials}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email || 'メール未設定'}</p>
              </div>
              <button
                onClick={() => setEditingProfile(v => !v)}
                className="flex items-center gap-1.5 text-primary text-sm font-bold px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                {editingProfile ? '閉じる' : '編集'}
              </button>
            </div>

            {/* Inline edit form */}
            <AnimatePresence>
              {editingProfile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-4 space-y-3 border-b border-border/60 bg-secondary/20">
                    {/* Display name */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">表示名</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="例: 山田 太郎"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">メールアドレス</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>

                    {/* Favorite genres */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-2">お気に入りジャンル</label>
                      <div className="flex flex-wrap gap-2">
                        {GENRES.map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenre(g)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                              ${favoriteGenres.includes(g)
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card text-foreground border-border hover:bg-secondary'
                              }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save */}
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingName}
                      className="w-full py-2.5 bg-primary text-primary-foreground font-black text-sm rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {savingName
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />保存中...</>
                        : saved_
                        ? <><Check className="w-4 h-4" />保存しました！</>
                        : <>変更を保存する</>
                      }
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── NOTIFICATIONS ── */}
          <SectionLabel>通知設定</SectionLabel>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-1">

            <div className="flex items-center gap-3.5 px-4 min-h-[56px] border-b border-border/60">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">近隣店舗の新規出品</p>
                <p className="text-xs text-muted-foreground">周辺に新しいバッグが出たとき</p>
              </div>
              <Toggle value={notifNewListing} onChange={v => handleToggle('notifNewListing', v)} />
            </div>

            <div className="flex items-center gap-3.5 px-4 min-h-[56px] border-b border-border/60">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">お気に入り店舗の更新</p>
                <p className="text-xs text-muted-foreground">フォロー中の店舗が出品したとき</p>
              </div>
              <Toggle value={notifFavoriteUpdate} onChange={v => handleToggle('notifFavoriteUpdate', v)} />
            </div>

            <div className="flex items-center gap-3.5 px-4 min-h-[56px]">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">ポイント・キャンペーン通知</p>
                <p className="text-xs text-muted-foreground">ポイント失効やお得情報</p>
              </div>
              <Toggle value={notifPoints} onChange={v => handleToggle('notifPoints', v)} />
            </div>
          </div>

          {/* ── LOGOUT ── */}
          <SectionLabel>アカウント</SectionLabel>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 min-h-[56px] hover:bg-destructive/5 active:bg-destructive/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <span className="flex-1 font-bold text-sm text-destructive text-left">ログアウト</span>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">OsusOwake v1.0.0</p>
        </div>
      </div>
    </SettingsWrapper>
  );
}
