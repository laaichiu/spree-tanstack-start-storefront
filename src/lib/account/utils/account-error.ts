import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'

const ACCOUNT_INTERNAL_ID_PATTERN =
  /\b(?:addr|address|card|cc|credit|credit_card|cus|customer|ful|fulfillment|gc|gcus|gift_card|line|line_item|li|market|mkt|order|or|payment|payment_method|payment_session|pm|promo|promotion|ps|pss|py|rate|ship|shipment|store|store_credit|token|tok|user|usr|variant)_[A-Za-z0-9]+\b/i

export function readAccountMutationErrorMessage(
  error: unknown,
  fallback: string,
) {
  const message = readErrorMessageText(error)

  if (
    !message ||
    ACCOUNT_INTERNAL_ID_PATTERN.test(message) ||
    isUnsafeErrorMessage(message)
  ) {
    return fallback
  }

  return message
}
