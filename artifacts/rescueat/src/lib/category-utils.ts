export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'restaurant':  return '🍱';
    case 'bakery':      return '🥐';
    case 'cafe':        return '☕';
    case 'supermarket': return '🛒';
    case 'convenience': return '🏪';
    case 'sweets':      return '🍰';
    case 'other':       return '🥗';
    case 'produce':     return '🍎';
    case 'meat':        return '🥩';
    case 'noodles':     return '🍜';
    case 'drinks':      return '🥤';
    case 'assorted':    return '🎁';
    default:            return '📦';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'restaurant':  return 'お弁当・惣菜';
    case 'bakery':      return 'パン';
    case 'cafe':        return 'カフェ';
    case 'supermarket': return 'スーパー';
    case 'convenience': return 'コンビニ';
    case 'sweets':      return 'スイーツ';
    case 'other':       return 'その他';
    case 'produce':     return '野菜・果物';
    case 'meat':        return '肉・魚';
    case 'noodles':     return '麺類';
    case 'drinks':      return 'ドリンク';
    case 'assorted':    return '詰め合わせ';
    default:            return 'その他';
  }
}

export function getCategoryImage(category: string): string {
  switch (category) {
    case 'restaurant':  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    case 'bakery':      return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80';
    case 'cafe':        return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80';
    case 'supermarket': return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80';
    case 'convenience': return 'https://images.unsplash.com/photo-1581458925565-df0bd529a674?w=800&q=80';
    case 'sweets':      return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80';
    case 'other':       return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80';
    case 'produce':     return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
    case 'meat':        return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80';
    case 'noodles':     return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80';
    case 'drinks':      return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80';
    case 'assorted':    return 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80';
    default:            return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  }
}
