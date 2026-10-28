import { CART_MARKET_MISMATCH_MESSAGE } from '@/lib/cart/utils/cart-market'

function isCartMarketMismatchMessage(value: unknown) {
  if (typeof value === 'string') {
    return value === CART_MARKET_MISMATCH_MESSAGE
  }

  return (
    value instanceof Error && value.message === CART_MARKET_MISMATCH_MESSAGE
  )
}

export function getCheckoutLoadErrorMessage({
  error,
  fallback,
  initialError,
}: {
  error: unknown
  fallback: string
  initialError?: string | null
}) {
  if (
    isCartMarketMismatchMessage(error) ||
    isCartMarketMismatchMessage(initialError)
  ) {
    return CART_MARKET_MISMATCH_MESSAGE
  }

  return fallback
}
