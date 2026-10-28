import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'

const NEWSLETTER_INTERNAL_ID_PATTERN =
  /\b(?:newsletter|newsletter_subscriber|subscriber|subscription|sub|customer|cus|market|mkt|store|token|spree)_[A-Za-z0-9_]+\b/i

export function readNewsletterErrorMessage(error: unknown, fallback: string) {
  const message = readErrorMessageText(error)

  if (
    !message ||
    NEWSLETTER_INTERNAL_ID_PATTERN.test(message) ||
    isUnsafeErrorMessage(message)
  ) {
    return fallback
  }

  return message
}
