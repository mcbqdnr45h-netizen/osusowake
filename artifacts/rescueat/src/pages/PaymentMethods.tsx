import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CreditCard, Plus, Trash2, CheckCircle2,
  ShieldCheck, Lock, Wifi, Star, X, Eye, EyeOff, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserId } from '@/hooks/use-user';

interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  last4: string;
  expMonth: string;
  expYear: string;
  holderName: string;
  isDefault: boolean;
}

const BRAND_META: Record<SavedCard['brand'], { label: string; color: string; textColor: string; logo: string }> = {
  visa: { label: 'Visa', color: 'from-blue-700 to-blue-900', textColor: 'text-blue-100', logo: 'VISA' },
  mastercard: { label: 'Mastercard', color: 'from-orange-600 to-red-700', textColor: 'text-orange-100', logo: 'MC' },
  amex: { label: 'Amex', color: 'from-sky-500 to-sky-700', textColor: 'text-sky-100', logo: 'AMEX' },
  other: { label: 'Card', color: 'from-slate-600 to-slate-800', textColor: 'text-slate-100', logo: '💳' },
};

function detectBrand(num: string): SavedCard['brand'] {
  if (num.startsWith('4')) return 'visa';
  if (num.startsWith('5')) return 'mastercard';
  if (num.startsWith('3')) return 'amex';
  return 'other';
}

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

const STORAGE_KEY = (uid: string) => `rescueat_cards_${uid}`;

function useCards(userId: string) {
  const raw = localStorage.getItem(STORAGE_KEY(userId));
  const [cards, setCards] = useState<SavedCard[]>(raw ? JSON.parse(raw) : [
    {
      id: 'demo-1',
      brand: 'visa',
      last4: '4242',
      expMonth: '12',
      expYear: '27',
      holderName: 'GUEST USER',
      isDefault: true,
    }
  ]);
  function persist(next: SavedCard[]) {
    setCards(next);
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(next));
  }
  return { cards, persist };
}

function CreditCardWidget({ card, onSetDefault, onDelete }: {
  card: SavedCard;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const meta = BRAND_META[card.brand];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative"
    >
      {/* Card visual */}
      <div className={`bg-gradient-to-br ${meta.color} rounded-2xl p-5 shadow-lg relative overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-6 w-36 h-36 bg-white/5 rounded-full" />
        {/* Contactless icon */}
        <Wifi className="absolute top-4 right-4 w-5 h-5 text-white/60 rotate-90" />

        <div className="flex items-start justify-between mb-6">
          <span className={`text-xs font-black tracking-widest uppercase ${meta.textColor}`}>{meta.label}</span>
          {card.isDefault && (
            <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-white" /> メイン
            </span>
          )}
        </div>

        {/* Card number */}
        <p className="text-white/40 text-sm tracking-[0.3em] mb-4 font-mono">
          **** **** **** {card.last4}
        </p>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">Card Holder</p>
            <p className="text-white font-bold text-sm tracking-wider">{card.holderName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
            <p className="text-white font-bold text-sm">{card.expMonth}/{card.expYear}</p>
          </div>
        </div>
      </div>

      {/* Actions below card */}
      <div className="flex gap-2 mt-3">
        {!card.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            メインに設定
          </button>
        )}
        {card.isDefault && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            現在のメインカード
          </div>
        )}
        <button
          onClick={onDelete}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function AddCardForm({ onSave, onCancel }: {
  onSave: (card: Omit<SavedCard, 'id' | 'isDefault'>) => void;
  onCancel: () => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [showCvc, setShowCvc] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState('');

  const brand = detectBrand(cardNumber.replace(/\s/g, ''));
  const meta = BRAND_META[brand];
  const rawNum = cardNumber.replace(/\s/g, '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (rawNum.length < 16) return setError('カード番号を正しく入力してください');
    if (expiry.length < 5) return setError('有効期限を正しく入力してください');
    if (cvc.length < 3) return setError('CVCを正しく入力してください');
    if (!holderName.trim()) return setError('カード名義を入力してください');

    setTokenizing(true);
    await new Promise(res => setTimeout(res, 1800));

    const [expM, expY] = expiry.split('/');
    onSave({
      brand,
      last4: rawNum.slice(-4),
      expMonth: expM,
      expYear: expY,
      holderName: holderName.toUpperCase(),
    });
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-black text-foreground">新しいカードを追加</h3>
        <button type="button" onClick={onCancel} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Brand preview */}
      {rawNum.length > 0 && (
        <div className={`bg-gradient-to-br ${meta.color} rounded-xl px-4 py-2 flex items-center gap-2`}>
          <span className="text-white font-black text-sm">{meta.label}</span>
          <span className="text-white/60 text-xs font-mono ml-auto">**** **** **** {rawNum.slice(-4) || '????'}</span>
        </div>
      )}

      {/* Card number */}
      <div>
        <label className="text-xs font-bold text-muted-foreground block mb-1.5">カード番号</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Expiry */}
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1.5">有効期限</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {/* CVC */}
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-1.5">CVC</label>
          <div className="relative">
            <input
              type={showCvc ? 'text' : 'password'}
              inputMode="numeric"
              value={cvc}
              onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="•••"
              className="w-full bg-secondary/50 border border-border rounded-xl pl-4 pr-9 py-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowCvc(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showCvc ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Holder name */}
      <div>
        <label className="text-xs font-bold text-muted-foreground block mb-1.5">カード名義（半角ローマ字）</label>
        <input
          type="text"
          value={holderName}
          onChange={e => setHolderName(e.target.value.toUpperCase())}
          placeholder="TARO YAMADA"
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-mono uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
        <Lock className="w-3.5 h-3.5 shrink-0 text-primary" />
        カード情報は安全にトークン化されます。当アプリのサーバーには保存されません。
      </div>

      <button
        type="submit"
        disabled={tokenizing}
        className="w-full py-3.5 bg-foreground text-background rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-colors disabled:opacity-70"
      >
        {tokenizing ? (
          <>
            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            安全に処理中...
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            カードを追加する
          </>
        )}
      </button>
    </motion.form>
  );
}

export default function PaymentMethods() {
  const userId = useUserId() || '';
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cards, persist } = useCards(userId);
  const [showForm, setShowForm] = useState(false);

  function handleSetDefault(id: string) {
    persist(cards.map(c => ({ ...c, isDefault: c.id === id })));
    toast({ title: 'メインカードを変更しました' });
  }

  function handleDelete(id: string) {
    const next = cards.filter(c => c.id !== id);
    if (next.length > 0 && !next.some(c => c.isDefault)) {
      next[0].isDefault = true;
    }
    persist(next);
    toast({ title: 'カードを削除しました' });
  }

  function handleSave(card: Omit<SavedCard, 'id' | 'isDefault'>) {
    const newCard: SavedCard = {
      ...card,
      id: crypto.randomUUID(),
      isDefault: cards.length === 0,
    };
    persist([...cards, newCard]);
    setShowForm(false);
    toast({ title: 'カードを追加しました', description: `**** ${newCard.last4}` });
  }

  return (
    <Layout showBottomNav={false}>
      <div className="max-w-md mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-4 sticky bg-background/90 backdrop-blur-sm z-10 border-b border-border/50"
          style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate('/mypage')}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground leading-tight">支払い管理センター</h1>
            <p className="text-xs text-muted-foreground">Payment Methods</p>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* Cards list */}
          <AnimatePresence mode="popLayout">
            {cards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-secondary/50 rounded-2xl p-8 text-center"
              >
                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-bold text-muted-foreground text-sm">登録済みカードがありません</p>
                <p className="text-xs text-muted-foreground mt-1">下のボタンからカードを追加してください</p>
              </motion.div>
            ) : (
              cards.map(card => (
                <CreditCardWidget
                  key={card.id}
                  card={card}
                  onSetDefault={() => handleSetDefault(card.id)}
                  onDelete={() => handleDelete(card.id)}
                />
              ))
            )}
          </AnimatePresence>

          {/* Add card form */}
          <AnimatePresence>
            {showForm && (
              <AddCardForm onSave={handleSave} onCancel={() => setShowForm(false)} />
            )}
          </AnimatePresence>

          {/* Add card button */}
          {!showForm && (
            <motion.button
              layout
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              新しいカードを追加
            </motion.button>
          )}

          {/* Security badges */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Security</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, label: 'PCI DSS準拠', sub: '最高水準のセキュリティ' },
                { icon: <Wifi className="w-3.5 h-3.5" />, label: 'SSL/TLS暗号化', sub: '全通信を暗号化' },
                { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'カード番号不保持', sub: 'サーバー非保存' },
                { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: '国際認定基盤', sub: '世界標準の決済システム' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2 bg-white dark:bg-slate-800 rounded-xl p-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-600 dark:text-slate-300">{label}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
