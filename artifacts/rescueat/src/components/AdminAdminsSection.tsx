import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { authedFetch } from '@/lib/authed-fetch';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
}

interface Props {
  currentUserId?: string | null;
}

export default function AdminAdminsSection({ currentUserId }: Props) {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await authedFetch(`${BASE}/api/admin/admins`, { headers: {} });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.message || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setAdmins(j.admins ?? []);
    } catch (e: any) {
      setErr(e?.message ?? '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast({ title: '有効な email を入力してください', variant: 'destructive' });
      return;
    }
    setAdding(true);
    try {
      const r = await authedFetch(`${BASE}/api/admin/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast({ title: '追加に失敗しました', description: j?.message ?? `HTTP ${r.status}`, variant: 'destructive' });
        return;
      }
      toast({ title: '管理者を追加しました', description: email });
      setNewEmail('');
      fetchAdmins();
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (target: AdminUser) => {
    if (target.id === currentUserId) {
      toast({ title: '自分自身は削除できません', variant: 'destructive' });
      return;
    }
    if (!confirm(`${target.email ?? target.id} の管理者権限を剥奪しますか？`)) return;
    setRevoking(target.id);
    try {
      const r = await authedFetch(`${BASE}/api/admin/admins/${encodeURIComponent(target.id)}`, {
        method: 'DELETE',
        headers: {},
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast({ title: '剥奪に失敗しました', description: j?.message ?? `HTTP ${r.status}`, variant: 'destructive' });
        return;
      }
      toast({ title: '管理者権限を剥奪しました' });
      fetchAdmins();
    } finally {
      setRevoking(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-border p-5 mt-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-base font-black text-foreground">管理者の管理</h2>
        </div>
        <button
          type="button"
          onClick={fetchAdmins}
          disabled={loading}
          className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
        管理者権限を持つユーザーの一覧です。 新しい管理者を追加するには、 該当ユーザーが先にサインアップしている必要があります。
        最後の 1 名と自分自身は削除できません。
      </p>

      {/* 追加 UI */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new-admin@example.com"
          className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={adding}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !newEmail.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm inline-flex items-center gap-1.5 disabled:opacity-40 hover:bg-primary/90"
        >
          <UserPlus className="w-4 h-4" />
          {adding ? '追加中…' : '追加'}
        </button>
      </div>

      {/* 一覧 */}
      {err && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs mb-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">読み込み中…</p>
      ) : admins.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">登録された管理者はいません</p>
      ) : (
        <ul className="space-y-2">
          {admins.map((a) => {
            const isSelf = a.id === currentUserId;
            const isLast = admins.length <= 1;
            const disabled = isSelf || isLast || revoking === a.id;
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">
                    {a.full_name || '(名前未設定)'}
                    {isSelf && <span className="ml-2 text-[10px] font-bold text-primary">あなた</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">{a.email ?? a.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(a)}
                  disabled={disabled}
                  title={isSelf ? '自分自身は削除できません' : isLast ? '最後の管理者は削除できません' : '管理者権限を剥奪'}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {revoking === a.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
