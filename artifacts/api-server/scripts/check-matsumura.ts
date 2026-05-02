import { supabaseAdmin } from '../src/lib/supabase';

(async () => {
  const tables = ['surprise_bags', 'orders', 'reservations', 'favorites', 'admin_audit_log'];

  for (const t of tables) {
    console.log(`\n[${t}]`);
    for (const sid of [125, 126]) {
      const { data, error, count } = await supabaseAdmin
        .from(t)
        .select('*', { count: 'exact' })
        .eq('store_id', sid);
      if (error) {
        console.log(`  store_id=${sid}: エラー ${error.message}`);
      } else {
        console.log(`  store_id=${sid}: ${count} 件 ${data?.length ? `(sample: ${JSON.stringify(data[0]).slice(0, 150)})` : ''}`);
      }
    }
  }
  process.exit(0);
})();
