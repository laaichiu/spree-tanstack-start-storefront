export type CartMarketIdentity = {
  currencyCode?: string | null
  marketId?: string | null
}

function normalizeId(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.trim().toUpperCase() || null
}

export function getCartMarketKey(market: CartMarketIdentity) {
  const marketId = normalizeId(market.marketId)

  if (marketId) {
    return `market:${marketId}`
  }

  const currencyCode = normalizeCurrency(market.currencyCode)

  return currencyCode ? `currency:${currencyCode}` : null
}

export function isCartMarketKeyCompatibleWithMarket(
  cartMarketKey: string | null | undefined,
  market: CartMarketIdentity,
) {
  const normalizedCartMarketKey = normalizeId(cartMarketKey)

  if (!normalizedCartMarketKey) {
    return true
  }

  const expectedCartMarketKey = getCartMarketKey(market)

  return (
    !expectedCartMarketKey || normalizedCartMarketKey === expectedCartMarketKey
  )
}
