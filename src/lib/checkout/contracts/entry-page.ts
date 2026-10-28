import type { CartSummary } from '../../cart/contracts'
import type { CheckoutOrder } from './checkout'
import { isCheckoutOrder } from './checkout-order'

export type CheckoutEntryPageModel =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unavailable' }
  | { order: CheckoutOrder; status: 'ready' }

export function getCheckoutEntryPageModel({
  cart,
  hasLoadError,
  isLoading,
}: {
  cart: CartSummary | CheckoutOrder | null | undefined
  hasLoadError: boolean
  isLoading: boolean
}): CheckoutEntryPageModel {
  if (isLoading && !hasLoadError) {
    return { status: 'loading' }
  }

  if (hasLoadError) {
    return { status: 'error' }
  }

  if (!cart || cart.items.length === 0 || !isCheckoutOrder(cart)) {
    return { status: 'unavailable' }
  }

  return { order: cart, status: 'ready' }
}
