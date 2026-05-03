# Threat Model — おすそわけ (Osusowake)

## Project Overview

おすそわけ (Osusowake) is a Japanese food-rescue marketplace inspired by Too Good To Go. Restaurants list end-of-day "surprise bags" of surplus food at a discount; consumers reserve and pay for them in advance, then pick them up during a per-store window.

- **Stack**: pnpm monorepo with Node.js 24, Express 5 API (`artifacts/api-server`), React 19 + Vite SPA (`artifacts/rescueat`), Capacitor 8 wrapper for iOS (Bundle `com.yuhi.osusowake`).
- **Data plane**: Supabase PostgreSQL via Drizzle ORM (`SUPABASE_DATABASE_URL`). Auth is Supabase Auth (email/password + Google/Apple OAuth) — the API verifies Supabase JWTs server-side.
- **Payments**: Stripe Connect (destination charges) — platform fee 25% retained by the platform; per-user 5% service fee added on top of merchandise. Stripe webhook signature verification is mandatory (`STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET_CONNECT`).
- **Push**: APNs (production), VAPID Web Push.
- **Production URL**: https://osusowakejapan.org/
- **Users**: end consumers (customers), store owners (KYC'd via Stripe Connect), and platform admins (DB role `users.role = 'admin'`).

## Assets

- **User accounts & sessions** — Supabase JWTs and refresh tokens. Compromise allows account takeover, fraudulent reservations, and access to PII.
- **Personal data (PII)** — names, phone numbers (UNIQUE), email addresses, and pickup history. Phone uniqueness in particular makes leakage useful for re-identification.
- **Payment data** — Stripe customer IDs, PaymentIntent IDs, Connect account IDs. Raw card data is never stored (Stripe Elements / Stripe.js handles tokenization), but server-side keys can initiate charges and refunds.
- **Store KYC artifacts** — uploaded business licenses and identification, persisted in Supabase Storage. Highly sensitive PII.
- **Business data** — store revenue, sales leads, audit logs, app settings, ranking opt-in state.
- **Application secrets** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DATABASE_URL`, `RESEND_API_KEY`, `APNS_PRIVATE_KEY`, `VAPID_PRIVATE_KEY`, `ADMIN_APPROVAL_SECRET`. Compromise of the service-role key bypasses all RLS; compromise of Stripe secret key allows arbitrary charges/refunds.
- **Admin role membership** — `users.role = 'admin'` rows in Supabase. Compromise of any admin account exposes the entire admin surface (full read/write of stores, payouts, refunds, user data).

## Trust Boundaries

- **Browser / Capacitor app ↔ API** — every request crosses an untrusted client boundary. The API must independently verify the Supabase JWT and re-derive authorization from the token, never from request body fields.
- **API ↔ Supabase PostgreSQL** — the API uses Drizzle with parameterized queries against the service-role connection (`SUPABASE_DATABASE_URL`). Any SQL injection at the API layer would bypass RLS entirely.
- **API ↔ Supabase Auth Admin API** — the API uses `SUPABASE_SERVICE_ROLE_KEY` to read `auth.users` (e.g. for admin email lookup). The service-role key MUST never be exposed to clients.
- **API ↔ Stripe (platform & Connect)** — outbound calls with `STRIPE_SECRET_KEY`. Inbound webhooks (`/stripe/webhook` and the Connect variant) MUST verify Stripe signatures with the corresponding webhook secrets; idempotency is enforced via `stripe_webhook_events` table.
- **Public ↔ Authenticated ↔ Admin** — three concentric privilege rings:
  - Public: store browsing, bag listings, search, sales-lead form (rate-limited).
  - Authenticated (customer / store_owner): reservations, payments, favorites, store dashboard scoped to own stores.
  - Admin (`users.role = 'admin'`): `/admin/*` API + `/admin` dashboard. Enforced server-side by `requireAdmin` (admin.ts) and `checkAdmin` (auth.ts), both consulting the DB only — no email allowlist.
- **Dev ↔ Production** — `process.env.NODE_ENV` and Supabase project separation. App-Review bypass paths (`APP_REVIEW_BYPASS_EMAILS`, `APP_REVIEW_DEMO_OWNER_IDS`) are env-gated allowlists; in production they default to a single demo email/owner to keep the bypass surface minimal.

## Scan Anchors

- **Production entry points**:
  - API: `artifacts/api-server/src/index.ts` (mounts all routers, runs idempotent migrations on boot).
  - Web SPA: `artifacts/rescueat/src/main.tsx` → `App.tsx` (React Router); served via Vite in dev, static build in production.
- **Highest-risk code areas**:
  - `artifacts/api-server/src/routes/payment.ts` & `stripe-webhook.ts` — money movement, refunds, webhook signature verification, idempotency keying.
  - `artifacts/api-server/src/routes/admin.ts` + `lib/admin.ts` — admin authorization, admin-management endpoints, audit log writes.
  - `artifacts/api-server/src/routes/auth.ts` — profile creation, role checks (`checkAdmin` → `lib/admin.ts::isUserAdmin`).
  - `artifacts/api-server/src/routes/reservations.ts` — pricing math (`computeUserTotal`, `roundTo10`), stock decrement, refund-failure admin notification.
  - `artifacts/api-server/src/routes/upload.ts` — file upload (KYC documents, bag images) — type/size validation matters.
  - `artifacts/api-server/src/middlewares/auth.ts` — JWT verification entry point.
- **Public surfaces** (no auth required): `GET /bags`, `GET /stores`, `GET /search`, `POST /admin/sales-leads` (rate-limited), `GET /health`, `POST /stripe/webhook` (signature-gated, not auth-gated).
- **Authenticated surfaces**: most `/user/*`, `/reservations`, `/favorites`, `/payment`, `/notifications`, `/push-notifications`, `/stores/*` (owner-scoped writes).
- **Admin surfaces**: everything under `/admin/*` (gated by `requireAdmin`).
- **Dev-only / build-time** (do not include in runtime threat surface):
  - `artifacts/mockup-sandbox` — local Vite component preview, not deployed.
  - Capacitor CLI / `@trapezedev/project` / `native-run` and their transitive `@xmldom/xmldom` (used only for iOS project file generation in CI/dev).
- **Recently hardened (2026-05)**: hardcoded `ADMIN_EMAIL` removed from `routes/admin.ts`, `routes/auth.ts`, `routes/reservations.ts`. Admin membership is now sourced exclusively from `users.role = 'admin'` and managed via `GET/POST/DELETE /admin/admins` with full audit logging.

## Threat Categories

### Spoofing

The Supabase JWT is the only client-presented identity proof. Every protected route MUST call `requireAuth` (or `checkAdmin`) before touching user-scoped data; relying on `userId` fields in the request body is forbidden — the user identity MUST come from the verified token. Stripe webhook handlers MUST verify the `Stripe-Signature` header against the matching `STRIPE_WEBHOOK_SECRET*` and reject any payload without a valid signature. The App-Review bypass MUST require both an email-allowlist match AND a demo-owner-id allowlist match before skipping Stripe verification or stock decrement, so a single misconfigured env var cannot enable free orders for arbitrary users.

### Tampering

All pricing math (merchandise price, 5% user service fee, 25% platform fee, refund amounts) MUST be recomputed server-side from `surprise_bags.discounted_price` and quantity — never trust client-supplied totals. The `users.role` value MUST only be writable through the audited admin-management endpoints (`POST/DELETE /admin/admins`); direct PATCH of role via generic profile-update routes MUST be rejected. Stock decrement MUST use atomic SQL (CTE / conditional UPDATE) to prevent oversell under concurrent reservations.

### Repudiation

Sensitive admin actions (admin grant/revoke, refund triggers, store approval/rejection/suspension, bag deletion) MUST be appended to `admin_audit_log` with `actor_user_id`, `action`, optional `target_user_id`, IP, user agent, and structured metadata. Stripe webhook deliveries MUST be persisted to `stripe_webhook_events` with the event ID as a primary key for replay-detection and forensic reconstruction.

### Information Disclosure

PII (email, phone number, address, KYC documents) MUST never appear in API responses to unrelated users. Owner-scoped endpoints MUST filter by the authenticated `userId` server-side (the client cannot ask for "all stores"). Service-role Supabase keys, Stripe secret keys, and webhook secrets MUST never appear in client bundles or version control. Error responses MUST expose only a short message (`{error, message}`); stack traces and underlying DB error text MUST stay in server logs.

The Google Maps JS API key is necessarily client-exposed (`VITE_MAPS_API_KEY`). Its blast radius MUST be reduced via Google Cloud Console restrictions: HTTP referrer allowlist (`osusowakejapan.org/*`, Capacitor app origin) and API restrictions (Maps JavaScript API + Places API only). Any commit of the key value to a public repository MUST trigger immediate rotation.

### Denial of Service

Public endpoints (`POST /admin/sales-leads`, `GET /search`, auth endpoints, `POST /payment/create-intent`) MUST be rate-limited to prevent abuse and cost-amplification (Stripe API calls are billable). File uploads MUST cap body size and reject non-image / non-PDF MIME types early. External calls (Stripe, Supabase Auth Admin, APNs, Resend) MUST have explicit timeouts so a third-party slowdown cannot exhaust the Express event loop. Migrations on boot MUST be idempotent and bounded so a restart loop cannot escalate into accidental data corruption.

### Elevation of Privilege

Admin authorization MUST be enforced server-side from the database (`users.role = 'admin'`) on every admin route — no email allowlists, no client-side gating. The "last admin" and "self-revoke" guards in `DELETE /admin/admins/:userId` MUST stay in place to prevent lockout and accidental privilege removal. Store-owner endpoints MUST verify `stores.owner_id == authenticatedUserId` (or admin) before any mutation; IDOR via numeric store/bag IDs is the primary risk here.

All DB queries MUST go through Drizzle's parameterized API or `client.query(text, params)` — string-concatenated SQL is prohibited. App-Review bypass code paths MUST stay tightly env-gated and double-checked (email AND owner-id) so the production allowlist cannot be widened by a single env-var typo.
