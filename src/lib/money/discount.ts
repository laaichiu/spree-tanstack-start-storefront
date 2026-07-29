import type { Money } from './money'

export function getDiscountPercent(
  price: Money | null | undefined,
  compareAtPrice: Money | null | undefined,
): number | null {
  if (
    !price ||
    !compareAtPrice ||
    price.currencyCode !== compareAtPrice.currencyCode ||
    compareAtPrice.amount <= price.amount ||
    compareAtPrice.amount <= 0
  ) {
    return null
  }

  const discountPercent = Math.round(
    ((compareAtPrice.amount - price.amount) / compareAtPrice.amount) * 100,
  )

  return discountPercent > 0 ? discountPercent : null
}
