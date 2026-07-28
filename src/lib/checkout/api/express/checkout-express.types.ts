import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

export type ExpressCheckoutOrderResult =
  | {
      order: CheckoutOrder
      success: true
    }
  | {
      error: string
      success: false
    }
