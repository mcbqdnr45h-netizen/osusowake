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
