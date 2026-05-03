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

// ── CORS allowlist (#2 セキュリティ) ───────────────────────────────────────────
// 全オリジン許可は CSRF / トークン漏洩リスクが高いため、 本番ドメイン + Capacitor
// (iOS / Android webview) のみ許可。 開発時は Replit プレビュー / localhost も許可。
// origin === undefined (curl, mobile native fetch, SSR) は CORS 対象外なので素通し。
// credentials: false — 現状 JWT は Authorization header で送るため cookie 不要。
const CORS_ALLOWED_ORIGINS = new Set<string>([
  "https://osusowakejapan.org",
  "https://www.osusowakejapan.org",
  "capacitor://localhost",
  "http://localhost",
  "ionic://localhost",
]);
const CORS_IS_DEV = process.env.NODE_ENV !== "production";
app.use(cors((req, cb) => {
  const origin = req.headers.origin;
  if (!origin) return cb(null, { origin: true, credentials: false });
  if (CORS_ALLOWED_ORIGINS.has(origin)) return cb(null, { origin: true, credentials: false });
  if (CORS_IS_DEV) {
    try {
      const u = new URL(origin);
      const host = u.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".replit.dev") ||
        host.endsWith(".replit.app")
      ) {
        return cb(null, { origin: true, credentials: false });
      }
    } catch { /* origin URL parse 失敗 → 拒否 */ }
  }
  console.warn(`[CORS] blocked origin: ${origin}`);
  cb(null, { origin: false });
}));

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

// ── 公開読み取り (ゲスト含む) 用の厳格 limiter ──────────────────────────────
// /api/bags, /api/stores 系の GET は認証不要で誰でも叩けるため、
// スクレイピング・列挙攻撃への耐性を上げる。
// 一般的な利用 (React Query refetch 60秒間隔 × 数エンドポイント) には十分余裕。
// GET 以外 (POST/PUT/PATCH/DELETE) はそもそも requireAuth が掛かっているので
// generalLimiter (600/min/IP) のみで十分 → ここでは GET だけを対象にする。
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  message: { error: "rate_limited", message: "リクエストが多すぎます。少し時間をおいてから再度お試しください。" },
});
const publicReadGate: express.RequestHandler = (req, res, next) => {
  if (req.method !== "GET") return next();
  return publicReadLimiter(req, res, next);
};

app.use("/api/auth", authLimiter);
// ★ 公開読み取りエンドポイント — generalLimiter より先に厳格な limiter を適用
//   (express-rate-limit は per-middleware カウンタなので両方独立に効く)
app.use("/api/bags", publicReadGate);
app.use("/api/stores", publicReadGate);
app.use("/api", generalLimiter);

// ── 401/403 を返したエンドポイントをログ出力（運用監視・デバッグ用）──
// 攻撃の試行検知・フロント認証バグの早期発見に役立つ。本番でも有用なので残す。
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[auth] ${res.statusCode} ${req.method} ${req.originalUrl}`);
    }
  });
  next();
});

app.use("/api", router);

export default app;
