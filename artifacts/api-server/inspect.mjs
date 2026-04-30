import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.SUPABASE_DATABASE_URL, ssl: { rejectUnauthorized: false }});
await c.connect();

const userCols = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position;`);
console.log('=== public.users cols ===');
console.log(JSON.stringify(userCols.rows, null, 2));

const triggers = await c.query(`SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_schema='auth' AND event_object_table='users';`);
console.log('=== triggers on auth.users ===');
console.log(JSON.stringify(triggers.rows, null, 2));

const stores = await c.query(`SELECT id, name, status, owner_id, city, stripe_charges_enabled FROM stores WHERE status='approved' ORDER BY id LIMIT 8;`);
console.log('=== approved stores ===');
console.log(JSON.stringify(stores.rows, null, 2));

const exists = await c.query(`SELECT id, email FROM auth.users WHERE email LIKE '%review%@osusowakejapan.org'`);
console.log('=== existing reviewer accounts ===');
console.log(JSON.stringify(exists.rows));

await c.end();
