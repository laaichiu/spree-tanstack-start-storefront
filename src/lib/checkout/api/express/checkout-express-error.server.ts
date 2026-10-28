import '@tanstack/react-start/server-only'

import { readCheckoutMutationErrorMessage } from '@/lib/checkout/utils/checkout-error'

export function readExpressCheckoutErrorMessage(
  error: unknown,
  fallback: string,
) {
  return readCheckoutMutationErrorMessage(error, fallback)
}
