/**
 * 「今月のおすそわけランキング」 画面
 *
 * 仕様:
 *   - 上位 10 名: アイコン / 表示名 / 回数
 *   - トップ 3: 金 (1) / 銀 (2) / 銅 (3) のメダル装飾
 *   - 自分の順位: 画面下部に sticky 固定、 上位との差を「あと N 回でランクアップ！」表示
 *   - コンセプト: 「奪い合う」のではなく「街への貢献を可視化」
 *
 * 補足:
 *   - 他ユーザのアバター画像は端末ローカル (localStorage) のため取得不可。
 *     表示名のイニシャル + パステルカラー背景でジェネリックなアイコンを生成する。
 *   - 自分のアバターのみ useAvatar() で表示。
 *   - BottomNav (z-50) との干渉対策で sticky bar を z-40 + safe-area padding。
 */
import React from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/Layout';
import {
  useGetMonthlyRanking,
  getGetMonthlyRankingQueryKey,
  useGetRankingPreference,
  useUpdateRankingPreference,
  getGetRankingPreferenceQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/hooks/use-user';
import { useAvatar } from '@/hooks/use-avatar';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Trophy, Medal, Award, Heart, TrendingUp, Pencil, Eye, EyeOff } from 'lucide-react';

// ─── 表示名から決定論的にパステル色を生成 (他ユーザのアバター代替) ──────────
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const palette = [
    'bg-rose-200 text-rose-700',
    'bg-amber-200 text-amber-700',
    'bg-emerald-200 text-emerald-700',
    'bg-sky-200 text-sky-700',
    'bg-violet-200 text-violet-700',
    'bg-pink-200 text-pink-700',
    'bg-teal-200 text-teal-700',
    'bg-orange-200 text-orange-700',
  ];
  return palette[h % palette.length];
}

function initialOf(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  // 日本語なら 1 文字目、 英字なら 1 文字目大文字
  return trimmed.charAt(0).toUpperCase();
}

// ─── ランクごとの装飾 (1-3 位はメダル + グラデ) ───────────────────────────
function rankDecor(rank: number): {
  ring: string;
  badge: string;
  icon: React.ReactNode;
  label: string;
} {
  if (rank === 1) return {
    ring: 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.45)]',
    badge: 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white',
    icon: <Trophy className="w-5 h-5" />,
    label: '金',
  };
  if (rank === 2) return {
    ring: 'ring-4 ring-slate-300 shadow-[0_0_16px_rgba(148,163,184,0.4)]',
    badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-white',
    icon: <Medal className="w-5 h-5" />,
    label: '銀',
  };
  if (rank === 3) return {
    ring: 'ring-4 ring-orange-300 shadow-[0_0_14px_rgba(251,146,60,0.4)]',
    badge: 'bg-gradient-to-br from-orange-300 to-amber-600 text-white',
    icon: <Award className="w-5 h-5" />,
    label: '銅',
  };
  return {
    ring: '',
    badge: 'bg-muted text-muted-foreground',
    icon: <span className="text-sm font-bold">{rank}</span>,
    label: '',
  };
}

// ─── プレビューカード内トグル (Settings.tsx の Toggle と同じ意匠) ──────
function MiniToggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${disabled ? 'opacity-60' : ''} ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function RankingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const userId = useUserId();
  const myAvatar = useAvatar(userId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useGetMonthlyRanking(
    { limit: 10 },
    {
      query: {
        queryKey: getGetMonthlyRankingQueryKey({ limit: 10 }),
        staleTime: 60_000,
      },
    },
  );

  // ─── ランキング掲載 ON/OFF ────────────────────────────────────────
  const { data: rankingPref } = useGetRankingPreference({
    query: {
      queryKey: getGetRankingPreferenceQueryKey(),
      enabled: !!user,
      staleTime: 60_000,
    },
  });
  const updateRankingPref = useUpdateRankingPreference({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRankingPreferenceQueryKey() });
        // ★ MyPage は limit:1、 RankingPage は limit:10。 ベースパス prefix-match で一括 invalidate
        queryClient.invalidateQueries({ queryKey: ['/api/ranking/monthly'] });
      },
      onError: (err: any) => {
        toast({
          title: '設定の保存に失敗しました',
          description: String(err?.message ?? err),
          variant: 'destructive',
        });
      },
    },
  });
  // 楽観的に値を表示するため、 mutation 中の variables を優先
  const rankingOptOut = updateRankingPref.isPending
    ? !!updateRankingPref.variables?.data?.rankingOptOut
    : !!rankingPref?.rankingOptOut;

  const monthLabel = React.useMemo(() => {
    const d = data?.monthStartIso ? new Date(data.monthStartIso) : new Date();
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
    }).format(d);
  }, [data?.monthStartIso]);

  return (
    <Layout showBottomNav={!!user}>
      <div
        className="w-full overflow-x-hidden flex-1 flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* ── ヘッダ ── */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/mypage')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"
            aria-label="戻る"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-foreground leading-tight">
              今月のおすそわけランキング
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monthLabel} ・ どれだけ街に貢献したかを可視化
            </p>
          </div>
        </div>

        {/* ── ヒーロー: トロフィーと月次回数 ── */}
        <div className="mx-4 mb-3 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200/60 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-amber-700">参加者</div>
              <div className="text-2xl font-black text-foreground">
                {data?.totalParticipants ?? '—'} <span className="text-sm font-bold text-muted-foreground">人</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-amber-700">毎月</div>
              <div className="text-xs font-bold text-foreground">1日 0:00</div>
              <div className="text-xs text-muted-foreground">リセット</div>
            </div>
          </div>
        </div>

        {/* ── あなたの表示名プレビュー + ランキング掲載 ON/OFF ── */}
        {data?.myRank?.displayName && (
          <div className="mx-4 mb-4 rounded-2xl bg-card border border-border/50 overflow-hidden">
            {/* 1行目: 表示名プレビュー + 編集 */}
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[13px] font-black text-primary">
                  {initialOf(data.myRank.displayName)}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-tight flex-1 min-w-0">
                {rankingOptOut ? (
                  <>あなたは <span className="font-black text-foreground">「{data.myRank.displayName}」</span> ですが、 現在 <span className="font-black text-foreground">非掲載</span> です</>
                ) : (
                  <>あなたは <span className="font-black text-foreground">「{data.myRank.displayName}」</span> として表示されます</>
                )}
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-1 text-[11px] font-bold text-primary shrink-0 px-2.5 py-1.5 hover:bg-primary/10 active:bg-primary/15 rounded-lg transition-colors"
                aria-label="表示名を変更"
              >
                <Pencil className="w-3 h-3" strokeWidth={2.6} />
                変更
              </button>
            </div>

            {/* 2行目: ランキング掲載 ON/OFF (その場で切替可能) */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-t border-border/40 bg-secondary/20">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                {rankingOptOut ? (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.4} />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.4} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-foreground leading-tight">
                  ランキングに掲載する
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  オフにすると他の人にあなたの名前は表示されません
                </p>
              </div>
              <MiniToggle
                value={!rankingOptOut}
                disabled={updateRankingPref.isPending}
                onChange={(v) => updateRankingPref.mutate({ data: { rankingOptOut: !v } })}
              />
            </div>
          </div>
        )}

        {/* ── ランキングリスト ── */}
        <div className="flex-1 px-4 pb-40">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              ランキングの取得に失敗しました。 通信状況をご確認ください。
            </div>
          ) : !data || data.topUsers.length === 0 ? (
            <div className="rounded-3xl bg-card border border-border/50 p-8 text-center">
              <Heart className="w-10 h-10 mx-auto mb-3 text-amber-400" strokeWidth={1.6} />
              <p className="text-sm font-bold text-foreground mb-1">まだ誰もおすそわけしていません</p>
              <p className="text-xs text-muted-foreground">あなたが今月の 1 人目になりませんか？</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topUsers.map((entry) => {
                const decor = rankDecor(entry.rank);
                const isMe = entry.userId === userId;
                return (
                  <div
                    key={entry.userId}
                    className={[
                      'flex items-center gap-3 p-3 rounded-2xl transition-colors',
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-white via-amber-50/40 to-white border border-amber-200/50'
                        : 'bg-card border border-border/40',
                      isMe ? 'ring-2 ring-primary/60 bg-primary/5' : '',
                    ].join(' ')}
                  >
                    {/* 順位バッジ */}
                    <div className={[
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black',
                      decor.badge,
                    ].join(' ')}>
                      {decor.icon}
                    </div>

                    {/* アバター (自分は実画像、 他人はイニシャル) */}
                    <div className={[
                      'w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-black text-lg shrink-0',
                      decor.ring,
                      isMe && myAvatar ? '' : colorForName(entry.displayName),
                    ].join(' ')}>
                      {isMe && myAvatar ? (
                        <img loading="lazy" decoding="async" src={myAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initialOf(entry.displayName)}</span>
                      )}
                    </div>

                    {/* 名前 + おすそわけ数 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">
                          {entry.displayName}
                        </p>
                        {isMe && (
                          <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full shrink-0">
                            あなた
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.count} 回おすそわけ
                      </p>
                    </div>

                    {/* 大きな回数表示 */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-foreground leading-none">
                        {entry.count}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                        回
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 自分の順位 (sticky bottom) ── */}
        {data && data.optedOut ? (
          <div
            className="fixed left-0 right-0 z-40 bg-amber-50/95 backdrop-blur-md border-t border-amber-200 px-4 py-3"
            style={{
              bottom: 'calc(72px + env(safe-area-inset-bottom))',
              paddingBottom: '0.75rem',
            }}
          >
            <div className="flex items-center gap-3 max-w-2xl mx-auto">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">
                  ランキング非表示中
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                  Settings の「ランキングに参加する」 をオンにすると表示されます
                </p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 px-3 py-2 rounded-xl shrink-0 transition-colors"
              >
                設定へ
              </button>
            </div>
          </div>
        ) : data && (
          <div
            className="fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border/60 px-4 pt-3"
            style={{
              // BottomNav (72px + safe-area) の上にぴったり乗せる
              bottom: 'calc(72px + env(safe-area-inset-bottom))',
              paddingBottom: '0.75rem',
            }}
          >
            <div className="flex items-center gap-3 max-w-2xl mx-auto">
              <div className={[
                'w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-black',
                rankDecor(data.myRank?.rank ?? 0).badge,
              ].join(' ')}>
                {data.myRank?.rank && data.myRank.rank > 0
                  ? (data.myRank.rank <= 3
                      ? rankDecor(data.myRank.rank).icon
                      : <span className="text-base">{data.myRank.rank}</span>)
                  : <span className="text-xs">圏外</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-muted-foreground leading-none mb-1">
                  あなたの現在の順位
                </div>
                {data.myRank && data.myRank.rank > 0 ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-foreground leading-none">
                      {data.myRank.rank}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">位</span>
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ・ 今月 {data.myRank.count} 回
                    </span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-foreground leading-tight">
                    今月はまだ未参加
                  </div>
                )}
              </div>
              <div className="text-right shrink-0 max-w-[40%]">
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-amber-600">
                  <TrendingUp className="w-3 h-3" />
                  {data.nextRankDelta === 0 ? '頂点キープ！' : 'あと'}
                </div>
                {data.nextRankDelta > 0 && (
                  <div className="text-base font-black text-foreground leading-tight">
                    {data.nextRankDelta} 回
                    <span className="text-[10px] font-bold text-muted-foreground ml-1">
                      でランクアップ
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
