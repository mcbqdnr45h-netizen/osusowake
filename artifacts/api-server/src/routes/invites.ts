import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// 招待コード生成 (8桁英数字 — 紛らわしい文字除外)
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// テーブル自動作成 (初回のみ・べき等)
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS invitations (
      id         SERIAL PRIMARY KEY,
      inviter_id TEXT        NOT NULL,
      code       TEXT UNIQUE NOT NULL,
      invitee_id TEXT        DEFAULT NULL,
      accepted_at TIMESTAMPTZ DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
}

// GET /api/me/invites/code — 自分の招待コードを取得 or 新規発行
router.get("/me/invites/code", requireAuth, async (req, res) => {
  try {
    const inviterId = req.authUser!.id;
    await ensureTable();

    // 既存コード検索 (invitee のない行 = 自分のマスター行)
    const existing = await db.execute<{ code: string }>(sql`
      SELECT code FROM invitations
      WHERE inviter_id = ${inviterId} AND invitee_id IS NULL
      LIMIT 1
    `);

    let code: string;
    if (existing.rows.length > 0) {
      code = existing.rows[0].code;
    } else {
      // 新規作成 (UNIQUE 衝突時は最大 5 回リトライ)
      let newCode = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        newCode = generateCode();
        try {
          await db.execute(sql`
            INSERT INTO invitations (inviter_id, code) VALUES (${inviterId}, ${newCode})
          `);
          break;
        } catch {
          // UNIQUE 衝突 → retry
        }
      }
      code = newCode;
    }

    // 承諾済み件数
    const accepted = await db.execute<{ cnt: string }>(sql`
      SELECT COUNT(*)::text AS cnt FROM invitations
      WHERE inviter_id = ${inviterId} AND invitee_id IS NOT NULL
    `);
    const acceptedCount = parseInt(accepted.rows[0]?.cnt ?? "0", 10);

    const appDomain = process.env.APP_DOMAIN ?? process.env.REPLIT_DEV_DOMAIN ?? "";
    const baseUrl = appDomain ? `https://${appDomain}` : "https://osusowakejapan.org";

    res.json({
      code,
      acceptedCount,
      inviteUrl: `${baseUrl}/rescueat/signup?invite=${code}`,
    });
  } catch (err: unknown) {
    console.error("[invites] get code error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

// POST /api/invites/accept — 招待コードを承諾
router.post("/invites/accept", requireAuth, async (req, res) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code?.trim()) {
      res.status(400).json({ error: "bad_request", message: "招待コードが必要です" });
      return;
    }
    const inviteeId = req.authUser!.id;
    await ensureTable();

    const normalizedCode = code.trim().toUpperCase();

    const found = await db.execute<{ id: number; inviter_id: string; invitee_id: string | null }>(sql`
      SELECT id, inviter_id, invitee_id FROM invitations WHERE code = ${normalizedCode} LIMIT 1
    `);
    if (found.rows.length === 0) {
      res.status(404).json({ error: "invalid_code", message: "招待コードが見つかりません" });
      return;
    }
    const invite = found.rows[0];
    if (invite.invitee_id !== null) {
      res.status(409).json({ error: "already_used", message: "この招待コードはすでに使用されています" });
      return;
    }
    if (invite.inviter_id === inviteeId) {
      res.status(400).json({ error: "self_invite", message: "自分の招待コードは使用できません" });
      return;
    }

    // 既に誰かのコードを承諾済みでないか確認
    const alreadyAccepted = await db.execute<{ cnt: string }>(sql`
      SELECT COUNT(*)::text AS cnt FROM invitations WHERE invitee_id = ${inviteeId}
    `);
    if (parseInt(alreadyAccepted.rows[0]?.cnt ?? "0", 10) > 0) {
      res.status(409).json({ error: "already_accepted", message: "すでに招待を承諾済みです" });
      return;
    }

    await db.execute(sql`
      UPDATE invitations SET invitee_id = ${inviteeId}, accepted_at = NOW() WHERE id = ${invite.id}
    `);
    res.json({ ok: true });
  } catch (err: unknown) {
    console.error("[invites] accept error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

// GET /api/me/badges — バッジ一覧
router.get("/me/badges", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    await ensureTable();

    const accepted = await db.execute<{ cnt: string }>(sql`
      SELECT COUNT(*)::text AS cnt FROM invitations
      WHERE inviter_id = ${userId} AND invitee_id IS NOT NULL
    `);
    const inviteCount = parseInt(accepted.rows[0]?.cnt ?? "0", 10);

    const badges = [
      { id: "invite_1",  label: "初めての招待",   emoji: "🌟", achieved: inviteCount >= 1  },
      { id: "invite_3",  label: "招待マスター",   emoji: "🏆", achieved: inviteCount >= 3  },
      { id: "invite_10", label: "招待レジェンド", emoji: "👑", achieved: inviteCount >= 10 },
    ];

    res.json({ badges, inviteCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

export default router;
