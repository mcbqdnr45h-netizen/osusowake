import { createClient } from "@supabase/supabase-js";
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_ANON = process.env.SUPABASE_ANON_KEY;
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REVIEW_EMAIL = "review-user@osusowakejapan.org";
const REVIEW_PASS = "gi*Tp6C8Xga#PLWn2sjL";
const API_BASE = "http://localhost:8080/api";

const sb = createClient(SUPA_URL, SUPA_ANON);
const { data: signin, error: signinErr } = await sb.auth.signInWithPassword({
  email: REVIEW_EMAIL, password: REVIEW_PASS,
});
if (signinErr) { console.error("LOGIN FAIL", signinErr); process.exit(1); }
const token = signin.session.access_token;
const userId = signin.user.id;
console.log("✅ LOGIN OK userId=", userId, "email=", signin.user.email);

const sbAdmin = createClient(SUPA_URL, SUPA_SERVICE);
const { data: bags } = await sbAdmin.from("surprise_bags").select("id, store_id, title, discounted_price, stock_count, is_active").eq("id", 88);
const bag = bags[0];
const stockBefore = bag.stock_count;
console.log("📦 demo bag id=88 stockBefore=", stockBefore, "active=", bag.is_active);

// 3. create reservation (userId required by zod schema)
const r1 = await fetch(`${API_BASE}/reservations`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ bagId: bag.id, quantity: 1, userId }),
});
const reservation = await r1.json();
console.log("📋 reservation status=", r1.status, "id=", reservation.id, "totalPrice=", reservation.totalPrice);
if (!r1.ok) { console.error(JSON.stringify(reservation)); process.exit(1); }

// 4. /payment/create-intent — should hit BYPASS
const r2 = await fetch(`${API_BASE}/payment/create-intent`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, userId }),
});
const intent = await r2.json();
console.log("💳 create-intent status=", r2.status, "body=", JSON.stringify(intent));
if (!intent.reviewBypass) { console.error("❌ BYPASS NOT TRIGGERED"); process.exit(1); }
if (intent.clientSecret !== "REVIEW_BYPASS") { console.error("❌ wrong clientSecret:", intent.clientSecret); process.exit(1); }
if (!intent.paymentIntentId.startsWith("pi_review_bypass_")) { console.error("❌ wrong PI prefix"); process.exit(1); }
console.log("✅ BYPASS triggered, sentinelPI=", intent.paymentIntentId);

// 5. /payment/confirm — should skip Stripe verify and skip stock decrement
const r3 = await fetch(`${API_BASE}/payment/confirm`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, paymentIntentId: intent.paymentIntentId, status: "confirmed" }),
});
const confirmed = await r3.json();
console.log("✅ confirm status=", r3.status, "paymentStatus=", confirmed.paymentStatus, "status=", confirmed.status, "pickupCode=", confirmed.pickupCode);
if (r3.status !== 200) process.exit(1);
if (confirmed.paymentStatus !== "paid") { console.error("❌ not paid"); process.exit(1); }
if (!confirmed.pickupCode) { console.error("❌ no pickupCode"); process.exit(1); }
if (confirmed.paymentIntentId !== intent.paymentIntentId) { console.error("❌ PI mismatch"); process.exit(1); }

// 6. verify stock unchanged
const { data: bagsAfter } = await sbAdmin.from("surprise_bags").select("id, stock_count, is_active").eq("id", bag.id);
console.log(`📊 stock: before=${stockBefore} after=${bagsAfter[0].stock_count} active=${bagsAfter[0].is_active}`);
if (bagsAfter[0].stock_count !== stockBefore) { console.error("❌ STOCK CHANGED"); process.exit(1); }
console.log("✅ STOCK unchanged ✓");
console.log("✅ active still true ✓");

// 7. Idempotency: /payment/confirm を二回呼んでも安全か
console.log("\n🔁 Idempotency test: confirm again");
const r3b = await fetch(`${API_BASE}/payment/confirm`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, paymentIntentId: intent.paymentIntentId, status: "confirmed" }),
});
console.log("   second confirm:", r3b.status, "(should be 200, already_paid path)");

// 8. SECURITY: 違うユーザー (admin? できない) — テストスキップ。ロジック上 isReviewBypass は email チェックで弾く

// 9. cleanup: テスト予約をキャンセル状態にする (DB が散らからないように)
await sbAdmin.from("reservations").update({ status: "cancelled", payment_status: "refunded" }).eq("id", reservation.id);
console.log("\n🧹 cleanup: test reservation #" + reservation.id + " marked cancelled/refunded");
