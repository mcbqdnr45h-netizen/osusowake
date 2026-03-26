import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());

// Stripe webhook は署名検証のため raw body が必要 — JSON ミドルウェアより前に登録
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use("/api", router);

export default app;
