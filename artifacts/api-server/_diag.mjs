import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const r1 = await sb.from("stores").select("*").ilike("name", "%タップス%");
console.log("=== タップスバーガー === error=", r1.error?.message);
console.log("rows=", r1.data?.length);
if (r1.data?.[0]) {
  const s = r1.data[0];
  console.log(`#${s.id} ${s.name}`);
  console.log("  owner_id:", s.owner_id);
  console.log("  stripe_account_id:", s.stripe_account_id);
  console.log("  stripe_charges_enabled:", s.stripe_charges_enabled);
  console.log("  stripe_needs_bank_reregister:", s.stripe_needs_bank_reregister);
  console.log("  business_url:", s.business_url);
  console.log("  status:", s.status);
  console.log("  updated_at:", s.updated_at);
  console.log("  created_at:", s.created_at);
  console.log("  ALL KEYS:", Object.keys(s).filter(k => k.includes("stripe") || k.includes("bank") || k.includes("reregister")));
}

const r2 = await sb.from("stores").select("id,name,stripe_needs_bank_reregister,updated_at").eq("stripe_needs_bank_reregister", true);
console.log("\n=== flagged === error=", r2.error?.message, "count=", r2.data?.length);
r2.data?.forEach(s => console.log(`  #${s.id} ${s.name} updated=${s.updated_at}`));

if (r1.data?.[0]?.owner_id) {
  const u = await sb.auth.admin.getUserById(r1.data[0].owner_id);
  console.log("\n=== owner ===", u.data?.user?.email, "created=", u.data?.user?.created_at);
}
