import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { data: signin } = await sb.auth.signInWithPassword({
  email: "review-user@osusowakejapan.org", password: "gi*Tp6C8Xga#PLWn2sjL",
});
const token = signin.session.access_token;
const userId = signin.user.id;
console.log("user.email=", signin.user.email);

const sbAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const r1 = await fetch("http://localhost:8080/api/reservations", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ bagId: 88, quantity: 1, userId }),
});
const reservation = await r1.json();
console.log("reservation status=", r1.status, "id=", reservation.id);

const r2 = await fetch("http://localhost:8080/api/payment/create-intent", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, userId }),
});
const intent = await r2.json();
console.log("create-intent:", r2.status, JSON.stringify(intent));

const r3 = await fetch("http://localhost:8080/api/payment/confirm", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ reservationId: reservation.id, paymentIntentId: intent.paymentIntentId, status: "confirmed" }),
});
const confirmed = await r3.json();
console.log("confirm:", r3.status, "FULL BODY:", JSON.stringify(confirmed));

await sbAdmin.from("reservations").update({ status: "cancelled", payment_status: "refunded" }).eq("id", reservation.id);
console.log("cleanup done");
