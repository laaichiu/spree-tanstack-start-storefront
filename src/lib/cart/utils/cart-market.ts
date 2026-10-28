import {
  getCartMarketKey,
  isCartMarketKeyCompatibleWithMarket,
} from '@/lib/cart/contracts'
import type { CartMarketIdentity } from '@/lib/cart/contracts'

export const CART_MARKET_MISMATCH_MESSAGE =
  'This cart belongs to a different market. Please start a new cart for the selected region.'

type MarketLike = CartMarketIdentity

type SpreeCartMarketResource = {
  currency?: unknown
  market_id?: unknown
}

export { getCartMarketKey, isCartMarketKeyCompatibleWithMarket }

function normalizeId(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

function normalizeCurrency(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  return value.trim().toUpperCase() || null
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

function hasUsableMarketId(value: unknown) {
  return value === null || (typeof value === 'string' && Boolean(value.trim()))
}

function hasUsableCurrency(value: unknown) {
  return typeof value === 'string' && Boolean(value.trim())
}

export function isSpreeCartResourceCompatibleWithMarket(
  cart: SpreeCartMarketResource,
  market: MarketLike,
) {
  if ('marketId' in market) {
    if (cart.market_id === undefined) {
      return false
    }

    const cartMarketId = normalizeId(cart.market_id)
    const expectedMarketId = normalizeId(market.marketId)

    if (cartMarketId !== expectedMarketId) {
      return false
    }
  }

  if ('currencyCode' in market) {
    if (typeof cart.currency !== 'string') {
      return false
    }

    const cartCurrency = normalizeCurrency(cart.currency)
    const expectedCurrency = normalizeCurrency(market.currencyCode)

    if (cartCurrency !== expectedCurrency) {
      return false
    }
  }

  return true
}

export function assertSpreeCartResourceHasMarketIdentity(
  cart: SpreeCartMarketResource,
  market: MarketLike,
) {
  if (
    ('marketId' in market &&
      (!('market_id' in cart) || !hasUsableMarketId(cart.market_id))) ||
    ('currencyCode' in market &&
      (!('currency' in cart) || !hasUsableCurrency(cart.currency)))
  ) {
    throw new CartMarketMismatchError()
  }
}

export function isSpreeCartResourceCompatibleWithMarketKey(
  cart: SpreeCartMarketResource,
  cartMarketKey: string | null | undefined,
) {
  const normalizedMarketKey = normalizeId(cartMarketKey)

  if (!normalizedMarketKey) {
    return true
  }

  const separatorIndex = normalizedMarketKey.indexOf(':')

  if (separatorIndex < 1) {
    return true
  }

  const kind = normalizedMarketKey.slice(0, separatorIndex)
  const value = normalizedMarketKey.slice(separatorIndex + 1)

  if (!value) {
    return true
  }

  if (kind === 'market') {
    return isSpreeCartResourceCompatibleWithMarket(cart, {
      marketId: value,
    })
  }

  if (kind === 'currency') {
    return isSpreeCartResourceCompatibleWithMarket(cart, {
      currencyCode: value,
    })
  }

  return true
}

export function assertSpreeCartResourceMatchesMarketKey(
  cart: SpreeCartMarketResource,
  cartMarketKey: string | null | undefined,
) {
  if (!isSpreeCartResourceCompatibleWithMarketKey(cart, cartMarketKey)) {
    throw new CartMarketMismatchError()
  }
}

export function assertSpreeCartResourceMatchesMarket(
  cart: SpreeCartMarketResource,
  market: MarketLike,
) {
  if (!isSpreeCartResourceCompatibleWithMarket(cart, market)) {
    throw new CartMarketMismatchError()
  }
}
