import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// shejsn のパスは知らんから service-role でセッション impersonate
const sbA = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: link } = await sbA.auth.admin.generateLink({
  type: "magiclink", email: "shejsn@icloud.com",
});
// magiclink から access_token はとれへんので、 service-role JWT で代用するために
// 別途 customer/auth セッション作るんやなくて、 store-owner として API 直叩きする方法を探す
// → API は Supabase JWT 必須。 仕方ないので /api/stores/117 を service-role JWT で呼べるか試す
const r = await fetch("http://localhost:8080/api/stores/117", {
  headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
});
console.log("status:", r.status);
const j = await r.json();
console.log("stripeStatus:", JSON.stringify(j.stripeStatus, null, 2));
console.log("stripeAccountId:", j.stripeAccountId);
console.log("status:", j.status);
