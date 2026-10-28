export type Money = {
  amount: number
  currencyCode: string
}

export function hasMeaningfulAmount(
  value: number | string | null | undefined,
): boolean {
  const amount = Number(value)

  return Number.isFinite(amount) && Math.abs(amount) > 0.0001
}

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
