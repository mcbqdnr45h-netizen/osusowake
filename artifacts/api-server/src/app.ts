import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import router from "./routes";

const app: Express = express();

// プロキシ越しの実 IP を取得するため Replit/CDN の X-Forwarded-For を信頼
app.set("trust proxy", 1);

// ── セキュリティヘッダ（Helmet）────────────────────────────────────────────────
// API サーバーなので CSP は不要（フロント側 Vite が制御）。HSTS / X-Content-Type-Options /
// Referrer-Policy / X-DNS-Prefetch-Control / X-Download-Options などのデフォルトを有効化。
// crossOriginResourcePolicy は same-site だと Capacitor から呼べないので緩めに cross-origin。
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

app.use(cors());

// Stripe webhook は署名検証のため raw body が必要 — JSON ミドルウェアより前に登録
// レート制限の対象外（Stripe からの正規再送をブロックしないため）
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── レート制限 ────────────────────────────────────────────────────────────────
// 一般 API: IP あたり 1分 600 リクエスト（NAT 配下の複数ユーザーを考慮して緩め）
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Stripe webhook と health は完全除外
  skip: (req) => req.path.startsWith("/stripe-webhook") || req.path === "/health",
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  message: { error: "rate_limited", message: "リクエストが多すぎます。少し時間をおいてから再度お試しください。" },
});

// 認証系: ブルートフォース対策で 1分 30 リクエスト/IP
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  message: { error: "rate_limited", message: "認証リクエストが多すぎます。1分後に再度お試しください。" },
});

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

app.use("/api", router);

export default app;
