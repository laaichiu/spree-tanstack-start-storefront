import type { CheckoutOrder } from '@/lib/checkout/contracts'

export type CheckoutCompletionErrorCode =
  | 'order_complete_failed'
  | 'payment_confirmation_failed'
  | 'payment_failed'
  | 'payment_session_not_ready'
  | 'payment_submit_failed'

export type CheckoutCompletionResult =
  | {
      order: CheckoutOrder | null
      success: true
    }
  | {
      error: string
      errorCode?: CheckoutCompletionErrorCode
      order?: CheckoutOrder | null
      success: false
    }
