import { Router, type IRouter } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();

router.get('/supabase/health', async (_req, res) => {
  try {
    const results: Record<string, string> = {};

    for (const table of ['users', 'stores', 'products', 'orders'] as const) {
      const { error } = await supabaseAdmin.from(table).select('id').limit(1);
      results[table] = error ? `ERROR: ${error.message}` : 'OK';
    }

    const allOk = Object.values(results).every(v => v === 'OK');
    res.status(allOk ? 200 : 500).json({
      status: allOk ? 'ok' : 'error',
      tables: results,
      supabaseUrl: process.env['SUPABASE_URL']?.replace('https://', '').split('.')[0] + '.supabase.co',
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/supabase/test-write', async (req, res) => {
  try {
    const { email = `test_${Date.now()}@rescueat.test`, role = 'customer' } = req.body ?? {};

    const { data: user, error: ue } = await supabaseAdmin
      .from('users')
      .insert({ email, role, points_balance: 0 })
      .select()
      .single();

    if (ue) {
      res.status(400).json({ error: ue.message });
      return;
    }

    await supabaseAdmin.from('users').delete().eq('id', user.id);

    res.json({
      success: true,
      message: 'Supabase 書き込み・読み取り・削除 すべて成功！',
      created: user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
