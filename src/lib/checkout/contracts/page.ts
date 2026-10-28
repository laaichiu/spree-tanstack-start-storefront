import type { CheckoutOrder } from './checkout'

/**
 * Serializable checkout page data. Interactive payment, address, and submit
 * capabilities remain owned by the storefront runtime.
 */
export type CheckoutPageModel = {
  error: string | null
  order: CheckoutOrder
}

/**
 * Serializable completed-order page data. Access validation and recovery
 * remain owned by the storefront runtime.
 */
export type OrderPlacedPageModel = {
  order: CheckoutOrder | null
}
