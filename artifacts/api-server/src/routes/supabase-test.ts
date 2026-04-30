import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router: IRouter = Router();

// 開発環境専用ガード — 本番では完全に 404 にする (情報漏洩 / テスト書き込み防止)
//
// ⚠️ 重要: path 指定 ('/supabase') を必ず付けること！
// `router.use(devOnly)` (path 無し) で適用すると、この子ルーター全体を
// 通過する **すべてのリクエスト** にマッチし、親 router で
// `router.use(supabaseTestRouter)` が path 無しマウントされている関係上、
// 本ファイルより後にマウントされた他のルーター (upload, notifications, ...) や
// 直接登録された route (/auth/forgot-password, /me 等) まで丸ごと 404 で
// 食われてしまう (本番で全 POST が壊れる致命的バグ)。
// path scoped にすることで、影響範囲を /supabase/* に厳密に限定する。
function devOnly(_req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  next();
}

router.use('/supabase', devOnly);

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
