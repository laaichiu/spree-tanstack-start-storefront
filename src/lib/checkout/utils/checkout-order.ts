import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

export function isCheckoutOrder(value: unknown): value is CheckoutOrder {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {
    paymentMethods?: unknown
    requirements?: unknown
  }

  return (
    Array.isArray(candidate.paymentMethods) &&
    Array.isArray(candidate.requirements)
  )
}
