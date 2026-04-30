import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: signin } = await sb.auth.signInWithPassword({
  email: "review-user@osusowakejapan.org", password: "gi*Tp6C8Xga#PLWn2sjL",
});
const token = signin.session.access_token;
const userId = signin.user.id;

const { data: bagBefore } = await sbAdmin.from("surprise_bags").select("stock_count, is_active").eq("id", 88);
console.log("BEFORE: stock=", bagBefore[0].stock_count, "active=", bagBefore[0].is_active);

const r1 = await fetch("http://localhost:8080/api/reservations", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ bagId: 88, quantity: 1, userId }),
});
const reservation = await r1.json();
console.log("[1] reservation #" + reservation.id, "totalPrice=" + reservation.totalPrice, "paymentStatus=" + reservation.paymentStatus);

const r2 = await fetch("http://localhost:8080/api/payment/create-intent", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, userId }),
});
const intent = await r2.json();
console.log("[2] create-intent reviewBypass=" + intent.reviewBypass, "PI=" + intent.paymentIntentId, "clientSecret=" + intent.clientSecret);

const r3 = await fetch("http://localhost:8080/api/payment/confirm", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, paymentIntentId: intent.paymentIntentId, status: "confirmed" }),
});
const confirmed = await r3.json();
console.log("[3] confirm status=" + r3.status, "paymentStatus=" + confirmed.paymentStatus, "status=" + confirmed.status, "pickupCode=" + confirmed.pickupCode);

const { data: bagAfter } = await sbAdmin.from("surprise_bags").select("stock_count, is_active").eq("id", 88);
console.log("AFTER: stock=", bagAfter[0].stock_count, "active=", bagAfter[0].is_active);

// Idempotency
const r3b = await fetch("http://localhost:8080/api/payment/confirm", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, paymentIntentId: intent.paymentIntentId, status: "confirmed" }),
});
const confirmed2 = await r3b.json();
console.log("[4] re-confirm status=" + r3b.status, "paymentStatus=" + confirmed2.paymentStatus);

await sbAdmin.from("reservations").update({ status: "cancelled", payment_status: "refunded" }).eq("id", reservation.id);
console.log("cleanup: marked #" + reservation.id + " cancelled/refunded");

// Assertions
const ok =
  r1.status === 201 &&
  intent.reviewBypass === true &&
  intent.clientSecret === "REVIEW_BYPASS" &&
  intent.paymentIntentId.startsWith("pi_review_bypass_") &&
  r3.status === 200 &&
  confirmed.paymentStatus === "paid" &&
  confirmed.status === "confirmed" &&
  !!confirmed.pickupCode &&
  bagAfter[0].stock_count === bagBefore[0].stock_count &&
  bagAfter[0].is_active === true &&
  r3b.status === 200;
console.log(ok ? "\n🎉 ALL CHECKS PASSED" : "\n❌ SOMETHING FAILED");
process.exit(ok ? 0 : 1);
