import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import crypto from "node:crypto";

const router: IRouter = Router();

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(len = 8): string {
  let s = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return s;
}

type Badge = { tier: number; label: string; emoji: string; threshold: number };
const BADGES: Badge[] = [
  { tier: 0, label: "招待まだ",            emoji: "🌱", threshold: 0 },
  { tier: 1, label: "おすそわけ初心者",    emoji: "🤝", threshold: 1 },
  { tier: 2, label: "おすそわけ広め隊",    emoji: "🎁", threshold: 3 },
  { tier: 3, label: "招待マスター",        emoji: "🌟", threshold: 5 },
  { tier: 4, label: "街のヒーロー",        emoji: "🏆", threshold: 10 },
];

function badgeFor(count: number): Badge {
  let current: Badge = BADGES[0]!;
  for (const b of BADGES) {
    if (count >= b.threshold) current = b;
  }
  return current;
}

function nextBadge(count: number): Badge | null {
  for (const b of BADGES) {
    if (b.threshold > count) return b;
  }
  return null;
}

// ── GET /me/invite-status ────────────────────────────────────────────────
// 自分の招待コード (なければ発行) と受け入れ人数 + 現在のバッジを返す
router.get("/me/invite-status", requireAuth, async (req, res) => {
  const userId = req.authUser!.id;
  try {
    let row = (await db.execute(sql`
      SELECT code FROM invitations
      WHERE inviter_id = ${userId} AND invitee_id IS NULL
      LIMIT 1
    `)).rows[0] as { code?: string } | undefined;

    if (!row) {
      let code = generateCode();
      for (let i = 0; i < 5; i++) {
        const dup = (await db.execute(sql`SELECT 1 FROM invitations WHERE code = ${code} LIMIT 1`)).rows[0];
        if (!dup) break;
        code = generateCode();
      }
      await db.execute(sql`
        INSERT INTO invitations (inviter_id, code) VALUES (${userId}, ${code})
      `);
      row = { code };
    }

    const countRow = (await db.execute(sql`
      SELECT COUNT(*)::int AS c FROM invitations
      WHERE inviter_id = ${userId} AND invitee_id IS NOT NULL AND accepted_at IS NOT NULL
    `)).rows[0] as { c?: number } | undefined;
    const accepted = Number(countRow?.c ?? 0);

    const badge = badgeFor(accepted);
    const next = nextBadge(accepted);
    res.json({
      code: row.code,
      acceptedCount: accepted,
      badge,
      nextBadge: next,
      remainingToNext: next ? Math.max(0, next.threshold - accepted) : 0,
      shareUrl: `https://osusowakejapan.org/?invite=${row.code}`,
      allBadges: BADGES,
    });
  } catch (e) {
    console.error("[invites/me/status] error", e);
    res.status(500).json({ error: "failed_to_load_invite_status" });
  }
});

// ── POST /invites/redeem ─────────────────────────────────────────────────
// サインアップ完了後に呼ぶ。 招待コードを使って自分を invitee として記録。
// 自分が自分を招待は不可、 既に redeem 済みも不可、 1ユーザにつき 1 回のみ。
router.post("/invites/redeem", requireAuth, async (req, res) => {
  const userId = req.authUser!.id;
  const code = String(((req.body ?? {}) as { code?: string }).code ?? "")
    .trim()
    .toUpperCase();
  if (!code || code.length < 4 || code.length > 16) {
    res.status(400).json({ error: "invalid_code" });
    return;
  }

  try {
    const existing = (await db.execute(sql`
      SELECT id FROM invitations
      WHERE invitee_id = ${userId}
      LIMIT 1
    `)).rows[0];
    if (existing) {
      res.status(409).json({ error: "already_redeemed" });
      return;
    }

    const inv = (await db.execute(sql`
      SELECT id, inviter_id FROM invitations
      WHERE code = ${code} AND invitee_id IS NULL
      LIMIT 1
    `)).rows[0] as { id?: number; inviter_id?: string } | undefined;
    if (!inv || !inv.id || !inv.inviter_id) {
      res.status(404).json({ error: "code_not_found" });
      return;
    }
    if (inv.inviter_id === userId) {
      res.status(400).json({ error: "self_invite_not_allowed" });
      return;
    }

    // 受諾行は別の UNIQUE code が必要 (テーブル定義上 code UNIQUE)。
    // crypto.randomUUID() で衝突確率実質 0、 同 ms 並列でも安全。
    const acceptedRowCode = `${code}__${crypto.randomUUID()}`;
    await db.execute(sql`
      INSERT INTO invitations (inviter_id, code, invitee_id, accepted_at)
      VALUES (${inv.inviter_id}, ${acceptedRowCode}, ${userId}, NOW())
    `);

    res.json({ ok: true, inviterId: inv.inviter_id });
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "";
    console.error("[invites/redeem] error", e);
    if (msg.includes("invitations_invitee_id_uniq")) {
      res.status(409).json({ error: "already_redeemed" });
      return;
    }
    res.status(500).json({ error: "redeem_failed" });
  }
});

export default router;
