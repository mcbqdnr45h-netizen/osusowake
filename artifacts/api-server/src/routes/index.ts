import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import bagsRouter from "./bags";
import reservationsRouter from "./reservations";
import paymentRouter from "./payment";
import supabaseTestRouter from "./supabase-test";
import uploadRouter from "./upload";
import notificationsRouter from "./notifications";
import { supabaseAdmin } from "../lib/supabase.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(bagsRouter);
router.use(reservationsRouter);
router.use(paymentRouter);
router.use(supabaseTestRouter);
router.use(uploadRouter);
router.use(notificationsRouter);

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "unauthorized", message: "Invalid token" });
      return;
    }
    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    res.json({
      id: user.id,
      name: meta.full_name || meta.name || user.email?.split("@")[0] || "ユーザー",
      email: user.email ?? "",
      role: meta.role ?? "user",
      createdAt: user.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/me] error:", msg);
    res.status(500).json({ error: "internal_error", message: msg });
  }
});

export default router;
