const USER_FEE_RATE = 0.05;

export function getDisplayPrice(basePrice: number | null | undefined): number {
  if (!basePrice || basePrice <= 0) return 0;
  return Math.ceil((basePrice * (1 + USER_FEE_RATE)) / 10) * 10;
}

export function getDisplaySavings(
  originalPrice: number | null | undefined,
  discountedPrice: number | null | undefined,
): number {
  return Math.max(0, getDisplayPrice(originalPrice) - getDisplayPrice(discountedPrice));
}

export function getDisplayDiscountPercent(
  originalPrice: number | null | undefined,
  discountedPrice: number | null | undefined,
): number {
  const o = getDisplayPrice(originalPrice);
  const d = getDisplayPrice(discountedPrice);
  if (o <= 0 || d <= 0 || d >= o) return 0;
  return Math.round((1 - d / o) * 100);
}
