export const CART_MARKET_MISMATCH_MESSAGE =
  'This cart belongs to a different market. Please start a new cart for the selected region.'

type MarketLike = {
  currencyCode?: string | null
  marketId?: string | null
}

type SpreeCartMarketResource = {
  currency?: string | null
  market_id?: string | null
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

export class CartMarketMismatchError extends Error {
  constructor(message = CART_MARKET_MISMATCH_MESSAGE) {
    super(message)
    this.name = 'CartMarketMismatchError'
  }
}

export function isCartMarketMismatchError(
  error: unknown,
): error is CartMarketMismatchError {
  return error instanceof CartMarketMismatchError
}

export function getCartMarketKey(market: MarketLike) {
  const marketId = normalizeId(market.marketId)

  if (marketId) {
    return `market:${marketId}`
  }

  const currencyCode = normalizeCurrency(market.currencyCode)

  return currencyCode ? `currency:${currencyCode}` : null
}

export function isCartMarketKeyCompatibleWithMarket(
  cartMarketKey: string | null | undefined,
  market: MarketLike,
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

export function isSpreeCartResourceCompatibleWithMarket(
  cart: SpreeCartMarketResource,
  market: MarketLike,
) {
  const cartMarketId = normalizeId(cart.market_id)
  const expectedMarketId = normalizeId(market.marketId)

  if (cartMarketId && expectedMarketId && cartMarketId !== expectedMarketId) {
    return false
  }

  const cartCurrency = normalizeCurrency(cart.currency)
  const expectedCurrency = normalizeCurrency(market.currencyCode)

  if (cartCurrency && expectedCurrency && cartCurrency !== expectedCurrency) {
    return false
  }

  return true
}

export function assertSpreeCartResourceMatchesMarket(
  cart: SpreeCartMarketResource,
  market: MarketLike,
) {
  if (!isSpreeCartResourceCompatibleWithMarket(cart, market)) {
    throw new CartMarketMismatchError()
  }
}
