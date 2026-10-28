import { getCartSummaryAmounts } from './summary-amounts'
import type { CartSummaryAmounts } from './summary-amounts'
import type { CartSummary } from './cart'

export type CartPageModel =
  | { status: 'loading' }
  | { reason: 'load_failed'; status: 'error' }
  | { status: 'empty' }
  | { cart: CartSummary; summary: CartSummaryAmounts; status: 'ready' }

export function getCartPageModel({
  cart,
  hasLoadError,
  isLoading,
}: {
  cart: CartSummary | null | undefined
  hasLoadError: boolean
  isLoading: boolean
}): CartPageModel {
  if (isLoading && !hasLoadError) {
    return { status: 'loading' }
  }

  if (hasLoadError) {
    return { reason: 'load_failed', status: 'error' }
  }

  if (!cart || cart.items.length === 0) {
    return { status: 'empty' }
  }

  return { cart, status: 'ready', summary: getCartSummaryAmounts(cart) }
}
