import { readCartFreeShippingPromotion } from '@/lib/cart/contracts'

export function getConfiguredCartFreeShippingPromotion(currencyCode: string) {
  return readCartFreeShippingPromotion(
    import.meta.env.VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT,
    currencyCode,
  )
}
