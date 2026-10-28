import type { CartFreeShippingProgress } from './free-shipping'
import { getCartFreeShippingProgress } from './free-shipping'
import type { CartFreeShippingPromotion, CartSummary } from './cart'
import type { CartShippingSummary } from './shipping-summary'
import { getCartShippingSummary } from './shipping-summary'
import { getCartSummaryAmounts } from './summary-amounts'
import type { CartSummaryAmounts } from './summary-amounts'

export type CartDrawerModel =
  | { status: 'loading' }
  | { reason: 'load_failed'; status: 'error' }
  | { status: 'empty' }
  | {
      cart: CartSummary
      freeShippingProgress: CartFreeShippingProgress | null
      summary: CartSummaryAmounts
      shippingSummary: CartShippingSummary
      status: 'ready'
    }

export function getCartDrawerModel({
  cart,
  freeShippingPromotion,
  hasLoadError,
  isLoading,
}: {
  cart: CartSummary | null | undefined
  freeShippingPromotion: CartFreeShippingPromotion | null
  hasLoadError: boolean
  isLoading: boolean
}): CartDrawerModel {
  if (hasLoadError) {
    return { reason: 'load_failed', status: 'error' }
  }

  if (isLoading) {
    return { status: 'loading' }
  }

  if (!cart || cart.items.length === 0) {
    return { status: 'empty' }
  }

  return {
    cart,
    freeShippingProgress: freeShippingPromotion
      ? getCartFreeShippingProgress(cart, freeShippingPromotion)
      : null,
    summary: getCartSummaryAmounts(cart),
    shippingSummary: getCartShippingSummary(cart),
    status: 'ready',
  }
}
