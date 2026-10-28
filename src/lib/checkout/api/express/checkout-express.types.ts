import type { CheckoutOrder } from '@/lib/checkout/contracts'

export type ExpressCheckoutOrderResult =
  | {
      order: CheckoutOrder
      success: true
    }
  | {
      error: string
      success: false
    }
