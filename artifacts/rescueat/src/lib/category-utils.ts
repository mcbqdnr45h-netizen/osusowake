export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'restaurant': return '🍱';
    case 'bakery': return '🥐';
    case 'cafe': return '☕';
    case 'supermarket': return '🛒';
    case 'convenience': return '🏪';
    default: return '📦';
  }
}

export function getCategoryImage(category: string): string {
  switch (category) {
    case 'restaurant': return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    case 'bakery': return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80';
    case 'cafe': return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80';
    case 'supermarket': return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80';
    case 'convenience': return 'https://images.unsplash.com/photo-1581458925565-df0bd529a674?w=800&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  }
}
