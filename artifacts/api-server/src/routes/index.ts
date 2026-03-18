import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storesRouter from "./stores";
import bagsRouter from "./bags";
import reservationsRouter from "./reservations";
import paymentRouter from "./payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storesRouter);
router.use(bagsRouter);
router.use(reservationsRouter);
router.use(paymentRouter);

router.get("/me", (_req, res) => {
  res.json({
    id: "guest-user",
    name: "ゲストユーザー",
    email: "guest@example.com",
    role: "user",
    createdAt: new Date().toISOString(),
  });
});

export default router;
