import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { useUserId } from '@/hooks/use-user';
import { useLocation, Link } from 'wouter';
import {
  ChevronLeft, User, Camera, Bell, Gift, LogOut,
  Copy, Share2, Check, ChevronRight, Mail, Pencil,
  FileText, Shield, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const GENRES = ['ベーカリー', 'お弁当', 'カフェ', 'レストラン', 'スーパー', 'コンビニ', 'スイーツ', '和食'];

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

export default function Settings() {
  const userId = useUserId() || '';
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { saved, save } = useLocalSettings(userId);

  const [displayName, setDisplayName] = useState(saved.displayName);
  const [email, setEmail] = useState(saved.email);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(saved.favoriteGenres);
  const [notifNewListing, setNotifNewListing] = useState(saved.notifNewListing);
  const [notifFavoriteUpdate, setNotifFavoriteUpdate] = useState(saved.notifFavoriteUpdate);
  const [notifPoints, setNotifPoints] = useState(saved.notifPoints);
  const [editingProfile, setEditingProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved_, setSaved_] = useState(false);

  // Referral code: first 6 chars of userId, uppercase
  const referralCode = `RESCUE${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

  // Avatar initials
  const initials = displayName.trim().slice(0, 2) || 'GU';

  function toggleGenre(g: string) {
    setFavoriteGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  function handleSaveProfile() {
    save({ displayName, email, favoriteGenres });
    setEditingProfile(false);
    setSaved_(true);
    setTimeout(() => setSaved_(false), 2000);
    toast({ title: 'プロフィールを保存しました' });
  }

  function handleToggle(key: 'notifNewListing' | 'notifFavoriteUpdate' | 'notifPoints', val: boolean) {
    if (key === 'notifNewListing') setNotifNewListing(val);
    if (key === 'notifFavoriteUpdate') setNotifFavoriteUpdate(val);
    if (key === 'notifPoints') setNotifPoints(val);
    save({ [key]: val });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'コードをコピーしました！', description: referralCode });
  }

  async function handleShare() {
    const text = `食べロスで食品ロスを一緒に減らしましょう！紹介コード「${referralCode}」を使うと初回特典があります 🌱\nhttps://rescueat.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '食べロスに参加しよう', text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'テキストをコピーしました！', description: '友達にシェアしてください' });
    }
  }

  function handleLogout() {
    navigate('/welcome');
  }

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-md mx-auto pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b border-border/50">
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
                      className="w-full py-2.5 bg-primary text-primary-foreground font-black text-sm rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {saved_ ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4 opacity-0 absolute" />}
                      変更を保存する
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

          {/* ── REFERRAL ── */}
          <SectionLabel>友達紹介</SectionLabel>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-1">

            {/* Campaign banner */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-4 border-b border-border/60">
              <div className="flex items-center gap-2 mb-1.5">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-black text-primary">友達紹介キャンペーン</span>
                <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  実施中
                </span>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                友達が初めてレスキューを完了すると、<br />
                あなたに <span className="text-primary font-black text-base">100pt</span> プレゼント！
              </p>
            </div>

            {/* Referral code */}
            <div className="px-4 py-4 border-b border-border/60">
              <p className="text-xs font-bold text-muted-foreground mb-2">あなたの紹介コード</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="font-black text-lg text-foreground tracking-widest">{referralCode}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0
                    ${copied ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                >
                  {copied
                    ? <Check className="w-5 h-5" />
                    : <Copy className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 font-bold text-primary hover:bg-primary/5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              友達に教える（シェア）
            </button>
          </div>

          {/* ── LEGAL ── */}
          <SectionLabel>規約・その他</SectionLabel>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-1">
            <Link href="/terms" className="flex items-center gap-3.5 px-4 min-h-[56px] hover:bg-secondary/60 transition-colors border-b border-border/60">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 font-bold text-sm text-foreground">利用規約</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link href="/privacy" className="flex items-center gap-3.5 px-4 min-h-[56px] hover:bg-secondary/60 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 font-bold text-sm text-foreground">プライバシーポリシー</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
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

          <p className="text-center text-xs text-muted-foreground pb-4">食べロス v1.0.0</p>
        </div>
      </div>
    </Layout>
  );
}
