import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from("surprise_bags").select("id, store_id, title, discounted_price, stock_count, is_active").or("title.ilike.%審査用%,store_id.eq.118");
console.log("rows:", JSON.stringify(data, null, 2), "err:", error?.message);
