import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'

const MARKET_INTERNAL_ID_PATTERN =
  /\b(?:country|locale|market|mkt|store|token)_[A-Za-z0-9]+\b/i

export function readMarketPreferenceErrorMessage(
  error: unknown,
  fallback: string,
) {
  const message = readErrorMessageText(error)

  if (
    !message ||
    MARKET_INTERNAL_ID_PATTERN.test(message) ||
    isUnsafeErrorMessage(message)
  ) {
    return fallback
  }

  return message
}
