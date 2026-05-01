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

export function getCategoryImage(category: string): string {
  switch (category) {
    case 'meals':
    case 'restaurant':
    case 'convenience':
    case 'meat':
    case 'noodles':
    case 'other':
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80';
    case 'bakery_sweets':
    case 'bakery':
    case 'sweets':
    case 'cafe':
      return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80';
    case 'ingredients':
    case 'produce':
    case 'supermarket':
    case 'drinks':
      return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
    case 'assorted':
      return 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80';
    default:
      return 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80';
  }
}

// 商品名のキーワードから画像を推測（カテゴリより優先度が高いフォールバック）
export function getImageFromName(name: string | undefined | null): string | null {
  if (!name) return null;

  // パン (cake より先に判定: "ケーキ" を含まないパン系)
  if (/パン|ぱん|bread|baguette|バゲット|食パン|クロワッサン|ベーグル|サンドイッチ/.test(name)) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80';
  }
  // ケーキ
  if (/ケーキ|cake|タルト|tart|ショートケーキ|チーズケーキ|ガトー/.test(name)) {
    return 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80';
  }
  // ドーナツ
  if (/ドーナツ|donut|doughnut/.test(name)) {
    return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80';
  }
  // スイーツ・お菓子全般
  if (/スイーツ|sweet|お菓子|菓子|プリン|ゼリー|マカロン|チョコ|クッキー|焼き菓子/.test(name)) {
    return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80';
  }
  // 弁当・お惣菜
  if (/弁当|べんとう|bento|お惣菜|惣菜|おかず/.test(name)) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80';
  }
  // 寿司
  if (/寿司|すし|sushi|刺身|海鮮/.test(name)) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80';
  }
  // 野菜
  if (/野菜|やさい|vegetable|サラダ|salad/.test(name)) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80';
  }
  // フルーツ
  if (/フルーツ|果物|くだもの|fruit|りんご|みかん|いちご|ブドウ/.test(name)) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80';
  }
  // 麺類
  if (/麺|ラーメン|うどん|そば|パスタ|ヌードル|noodle|pasta/.test(name)) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80';
  }
  // ピザ
  if (/ピザ|pizza/.test(name)) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80';
  }
  // ドリンク
  if (/ドリンク|drink|ジュース|juice|コーヒー|coffee|お茶|お酒/.test(name)) {
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80';
  }
  // 詰め合わせ・福袋
  if (/詰め合わせ|つめあわせ|福袋|セット|盛り合わせ|アソート|assort/.test(name)) {
    return 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80';
  }
  return null;
}
