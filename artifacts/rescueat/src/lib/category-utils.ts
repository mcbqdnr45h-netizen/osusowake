// 旧カテゴリ値も含めて 3 グループ ('meals' / 'bakery_sweets' / 'ingredients') + 'assorted' に正規化
// フィルタ判定 (Home / SearchPage) で必ず使うこと。 厳密一致で b.category === 'bakery_sweets' と
// 比較すると、DB に残っている旧値 (bakery, cafe, sweets, supermarket, produce, drinks 等) が
// 全て漏れてしまう。
export function normalizeCategory(category: string | null | undefined): string {
  switch (category) {
    case 'meals':
    case 'restaurant':
    case 'convenience':
    case 'meat':
    case 'noodles':
    case 'other':
      return 'meals';
    case 'bakery_sweets':
    case 'bakery':
    case 'cafe':
    case 'sweets':
      return 'bakery_sweets';
    case 'ingredients':
    case 'supermarket':
    case 'produce':
    case 'drinks':
      return 'ingredients';
    case 'assorted':
      return 'assorted';
    default:
      return 'meals';
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'meals':          return '🍱';
    case 'bakery_sweets':  return '🥐';
    case 'ingredients':    return '🍎';
    // 旧カテゴリ（後方互換）
    case 'restaurant':     return '🍱';
    case 'bakery':         return '🥐';
    case 'cafe':           return '🥐';
    case 'supermarket':    return '🍎';
    case 'convenience':    return '🍱';
    case 'sweets':         return '🥐';
    case 'other':          return '🍱';
    case 'produce':        return '🍎';
    case 'meat':           return '🍱';
    case 'noodles':        return '🍱';
    case 'drinks':         return '🍎';
    case 'assorted':       return '🎁';
    default:               return '📦';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'meals':          return '料理・お惣菜';
    case 'bakery_sweets':  return 'パン・スイーツ';
    case 'ingredients':    return '食材・その他';
    // 旧カテゴリ（後方互換）
    case 'restaurant':     return '料理・お惣菜';
    case 'bakery':         return 'パン・スイーツ';
    case 'cafe':           return 'パン・スイーツ';
    case 'supermarket':    return '食材・その他';
    case 'convenience':    return '料理・お惣菜';
    case 'sweets':         return 'パン・スイーツ';
    case 'other':          return '料理・お惣菜';
    case 'produce':        return '食材・その他';
    case 'meat':           return '料理・お惣菜';
    case 'noodles':        return '料理・お惣菜';
    case 'drinks':         return '食材・その他';
    case 'assorted':       return '詰め合わせ';
    default:               return 'その他';
  }
}

// ── カテゴリ別画像プール ──
//   App Store 審査の Guideline 2.1(a) (画像重複) を防ぐため、 各カテゴリに
//   複数のフォールバック画像を持たせ、 bag.id をシード値として一貫した
//   バリエーションを返す。 同じ bag は常に同じ画像 (タップ後の遷移で
//   画像がチラつかない)。
const CATEGORY_IMAGE_POOL: Record<string, string[]> = {
  meals: [
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80', // 鍋
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', // 弁当
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', // ボウル
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', // ピザ
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', // 定食
    'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80', // カレー
  ],
  bakery_sweets: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', // パン
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', // ケーキ
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', // 焼き菓子
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', // ドーナツ
    'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800&q=80', // クロワッサン
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80', // マフィン
  ],
  ingredients: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80', // 野菜
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80', // サラダ
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80', // フルーツ
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80', // 卵
    'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=800&q=80', // 肉
    'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80', // 食材詰め合わせ
  ],
  assorted: [
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  ],
};

// 文字列ハッシュ (シンプルな djb2)
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickFromPool(pool: string[], seed: string | number | undefined): string {
  if (!pool.length) return '';
  if (seed === undefined || seed === null) return pool[0];
  const n = typeof seed === 'number' ? Math.abs(seed) : strHash(String(seed));
  return pool[n % pool.length];
}

export function getCategoryImage(category: string, seed?: string | number): string {
  const key =
    category === 'meals' || category === 'restaurant' || category === 'convenience' ||
      category === 'meat' || category === 'noodles' || category === 'other'
      ? 'meals'
    : category === 'bakery_sweets' || category === 'bakery' || category === 'sweets' || category === 'cafe'
      ? 'bakery_sweets'
    : category === 'ingredients' || category === 'produce' || category === 'supermarket' || category === 'drinks'
      ? 'ingredients'
    : category === 'assorted'
      ? 'assorted'
    : 'meals';
  return pickFromPool(CATEGORY_IMAGE_POOL[key], seed);
}

// 商品名のキーワードから画像を推測（カテゴリより優先度が高いフォールバック）
//   seed (bag.id 推奨) でバリエーションを分散
const NAME_IMAGE_POOL: { test: RegExp; pool: string[] }[] = [
  { test: /パン|ぱん|bread|baguette|バゲット|食パン|クロワッサン|ベーグル|サンドイッチ/, pool: CATEGORY_IMAGE_POOL.bakery_sweets },
  { test: /ケーキ|cake|タルト|tart|ショートケーキ|チーズケーキ|ガトー/, pool: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80',
  ]},
  { test: /ドーナツ|donut|doughnut/, pool: [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
  ]},
  { test: /スイーツ|sweet|お菓子|菓子|プリン|ゼリー|マカロン|チョコ|クッキー|焼き菓子/, pool: [
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
      'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80',
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
  ]},
  { test: /弁当|べんとう|bento|お惣菜|惣菜|おかず/, pool: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  ]},
  { test: /寿司|すし|sushi|刺身|海鮮/, pool: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
  ]},
  { test: /野菜|やさい|vegetable|サラダ|salad/, pool: [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  ]},
  { test: /フルーツ|果物|くだもの|fruit|りんご|みかん|いちご|ブドウ/, pool: [
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
      'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&q=80',
  ]},
  { test: /麺|ラーメン|うどん|そば|パスタ|ヌードル|noodle|pasta/, pool: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
  ]},
  { test: /ピザ|pizza/, pool: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  ]},
  { test: /ドリンク|drink|ジュース|juice|コーヒー|coffee|お茶|お酒/, pool: [
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80',
  ]},
  { test: /詰め合わせ|つめあわせ|福袋|セット|盛り合わせ|アソート|assort/, pool: CATEGORY_IMAGE_POOL.assorted },
];

export function getImageFromName(name: string | undefined | null, seed?: string | number): string | null {
  if (!name) return null;
  for (const { test, pool } of NAME_IMAGE_POOL) {
    if (test.test(name)) return pickFromPool(pool, seed ?? name);
  }
  return null;
}
