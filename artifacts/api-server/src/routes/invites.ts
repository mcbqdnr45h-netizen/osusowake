import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { invitationsTable } from "@workspace/db/schema";
import { eq, sql, count, and, isNotNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// ─── バッジ定義 ─────────────────────────────────────────────────────────────
const BADGE_LEVELS = [
  { id: "invite_1",  label: "招待マスター 🌱",  desc: "1人招待達成！",        threshold: 1  },
  { id: "invite_3",  label: "招待マスター 🌿",  desc: "3人招待達成！",        threshold: 3  },
  { id: "invite_5",  label: "招待マスター 🌳",  desc: "5人招待達成！",        threshold: 5  },
  { id: "invite_10", label: "招待マスター 🏆",  desc: "10人招待の伝説！",     threshold: 10 },
] as const;

// ─── 8桁英数コード生成 ──────────────────────────────────────────────────────
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── テーブル初回作成 (IF NOT EXISTS) ──────────────────────────────────────
async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id          SERIAL PRIMARY KEY,
        inviter_id  TEXT NOT NULL,
        code        TEXT NOT NULL UNIQUE,
        invitee_id  TEXT,
        accepted_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (e: any) {
    console.warn("[invites] ensureTable:", e?.message);
  }
}
ensureTable();

// ── GET /api/me/invite ─────────────────────────────────────────────────────
// 自分の招待情報 (コード・受け入れ人数)
router.get("/me/invite", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;

    // 既存コード取得 or 新規作成
    let [existing] = await db
      .select()
      .from(invitationsTable)
      .where(
        and(eq(invitationsTable.inviterId, userId), sql`${invitationsTable.inviteeId} IS NULL`)
      )
      .limit(1);

    if (!existing) {
      // 未使用の自分のコードが無い場合は新規発行
      const existingAny = await db
        .select({ code: invitationsTable.code })
        .from(invitationsTable)
        .where(eq(invitationsTable.inviterId, userId))
        .limit(1);

      if (existingAny.length > 0) {
        // 既存(使用済み含む)があれば流用 → 常に同じコードで招待できるように
        const anyCode = existingAny[0].code;
        const [r] = await db
          .select({ code: invitationsTable.code })
          .from(invitationsTable)
          .where(and(eq(invitationsTable.inviterId, userId), eq(invitationsTable.code, anyCode)));
        if (!r) {
          const code = generateCode();
          const [ins] = await db.insert(invitationsTable).values({ inviterId: userId, code }).returning();
          existing = ins;
        } else {
          existing = { ...r, id: 0, inviterId: userId, inviteeId: null, acceptedAt: null, createdAt: new Date() };
        }
      } else {
        const code = generateCode();
        const [ins] = await db.insert(invitationsTable).values({ inviterId: userId, code }).returning();
        existing = ins;
      }
    }

    // 受け入れ人数
    const [{ accepted }] = await db
      .select({ accepted: count() })
      .from(invitationsTable)
      .where(
        and(eq(invitationsTable.inviterId, userId), isNotNull(invitationsTable.acceptedAt)),
      );

    const acceptedCount = Number(accepted ?? 0);
    const earnedBadges = BADGE_LEVELS.filter(b => acceptedCount >= b.threshold);
    const nextBadge    = BADGE_LEVELS.find(b => acceptedCount < b.threshold) ?? null;

    res.json({
      code:           existing.code,
      acceptedCount,
      earnedBadges,
      nextBadge,
      nextThreshold: nextBadge?.threshold ?? null,
    });
  } catch (err: any) {
    console.error("[/me/invite]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── POST /api/invites ──────────────────────────────────────────────────────
// 招待コードを新規発行 (または既存コードを返す)
router.post("/invites", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;

    // 既存コードがあればそれを返す
    const existing = await db
      .select({ code: invitationsTable.code })
      .from(invitationsTable)
      .where(eq(invitationsTable.inviterId, userId))
      .limit(1);

    if (existing.length > 0) {
      res.json({ code: existing[0].code });
      return;
    }

    // 衝突しないコードを生成 (最大5回)
    let code = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const dupe = await db
        .select({ id: invitationsTable.id })
        .from(invitationsTable)
        .where(eq(invitationsTable.code, candidate))
        .limit(1);
      if (dupe.length === 0) { code = candidate; break; }
    }
    if (!code) {
      res.status(500).json({ error: "code_generation_failed" });
      return;
    }

    const [row] = await db
      .insert(invitationsTable)
      .values({ inviterId: userId, code })
      .returning({ code: invitationsTable.code });

    res.json({ code: row.code });
  } catch (err: any) {
    console.error("[POST /invites]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── POST /api/invites/accept ───────────────────────────────────────────────
// 招待コードを受け入れる (認証必須・自分のコードは不可)
router.post("/invites/accept", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const { code } = req.body as { code?: string };

    if (!code?.trim()) {
      res.status(400).json({ error: "bad_request", message: "招待コードを入力してください" });
      return;
    }
    const normalizedCode = code.trim().toUpperCase();

    // コード検索
    const [invite] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.code, normalizedCode))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "not_found", message: "招待コードが見つかりません" });
      return;
    }
    if (invite.inviterId === userId) {
      res.status(400).json({ error: "self_invite", message: "自分の招待コードは使えません" });
      return;
    }

    // 既に自分が別コードで登録済みか確認
    const alreadyAccepted = await db
      .select({ id: invitationsTable.id })
      .from(invitationsTable)
      .where(and(eq(invitationsTable.inviteeId, userId), isNotNull(invitationsTable.acceptedAt)))
      .limit(1);

    if (alreadyAccepted.length > 0) {
      res.status(409).json({ error: "already_accepted", message: "招待コードはすでに使用済みです" });
      return;
    }

    // 招待を受け入れ: 同じ invitee_id のレコードは inviter のコードの別行を作成
    const [row] = await db
      .insert(invitationsTable)
      .values({
        inviterId:  invite.inviterId,
        code:       normalizedCode + "_" + userId.slice(0, 6),
        inviteeId:  userId,
        acceptedAt: new Date(),
      })
      .returning();

    // 招待主にバッジチェック (任意 - エラーは握り潰す)
    try {
      const [{ accepted }] = await db
        .select({ accepted: count() })
        .from(invitationsTable)
        .where(
          and(eq(invitationsTable.inviterId, invite.inviterId), isNotNull(invitationsTable.acceptedAt)),
        );
      console.log(`[invites] inviter ${invite.inviterId} now has ${accepted} accepted invites`);
    } catch { /* noop */ }

    res.json({ ok: true, inviterId: invite.inviterId });
  } catch (err: any) {
    console.error("[POST /invites/accept]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// ── GET /api/me/badges ─────────────────────────────────────────────────────
// 自分のバッジ一覧
router.get("/me/badges", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;

    const [{ accepted }] = await db
      .select({ accepted: count() })
      .from(invitationsTable)
      .where(
        and(eq(invitationsTable.inviterId, userId), isNotNull(invitationsTable.acceptedAt)),
      );

    const acceptedCount = Number(accepted ?? 0);
    const earnedBadges  = BADGE_LEVELS.filter(b => acceptedCount >= b.threshold);

    res.json({ earnedBadges, acceptedCount });
  } catch (err: any) {
    console.error("[/me/badges]", err?.message);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
