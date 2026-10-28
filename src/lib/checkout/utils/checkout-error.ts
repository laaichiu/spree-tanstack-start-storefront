import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'

const CHECKOUT_INTERNAL_ID_PATTERN =
  /\b(?:acct|addr|cart|cus|discount|fulfillment|gc|gift_card|line|line_item|li|market|mkt|order|or|payment|pm|pi|promotion|ps|rate|session|ship|shipment|store_credit|tok|variant)_[A-Za-z0-9]+\b/i
export function readCheckoutMutationErrorMessage(
  error: unknown,
  fallback: string,
) {
  const message = readErrorMessageText(error)

  if (
    !message ||
    CHECKOUT_INTERNAL_ID_PATTERN.test(message) ||
    isUnsafeErrorMessage(message)
  ) {
    return fallback
  }

  return message
}
