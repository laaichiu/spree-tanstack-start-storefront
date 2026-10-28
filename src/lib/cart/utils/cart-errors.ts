import { isSpreeErrorStatus } from '@/lib/spree/errors'
import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'

const RECOVERABLE_CART_COOKIE_STATUSES = [401, 403, 404] as const
const CART_INTERNAL_ID_PATTERN =
  /\b(?:cart|cus|fulfillment|li|line_item|order|payment|pm|rate|variant)_[A-Za-z0-9]+\b/i
const CART_SESSION_MISMATCH_MESSAGE =
  'This cart session no longer matches the active cart.'

export class CartSessionMismatchError extends Error {
  constructor() {
    super(CART_SESSION_MISMATCH_MESSAGE)
    this.name = 'CartSessionMismatchError'
  }
}

export const CART_ORDER_FALLBACK_NOT_COMPLETED_MESSAGE =
  'The cart order fallback is not completed.'

export class CartOrderFallbackNotCompletedError extends Error {
  constructor() {
    super(CART_ORDER_FALLBACK_NOT_COMPLETED_MESSAGE)
    this.name = 'CartOrderFallbackNotCompletedError'
  }
}

export function isCartOrderFallbackNotCompletedError(error: unknown) {
  return error instanceof CartOrderFallbackNotCompletedError
}

export function isCartSessionMismatchError(error: unknown) {
  return error instanceof CartSessionMismatchError
}

export function readCartMutationErrorMessage(error: unknown, fallback: string) {
  const message = readErrorMessageText(error)

  if (
    !message ||
    CART_INTERNAL_ID_PATTERN.test(message) ||
    isUnsafeErrorMessage(message)
  ) {
    return fallback
  }

  return message
}

export function isRecoverableCartCookieError(error: unknown) {
  if (isSpreeErrorStatus(error, RECOVERABLE_CART_COOKIE_STATUSES)) {
    return true
  }

  return error instanceof Error && /^not found$/i.test(error.message.trim())
}

export function isRecoverableCartResponseError(error: unknown) {
  if (isRecoverableCartCookieError(error)) {
    return true
  }

  return (
    error instanceof Error &&
    /Unexpected token '<'|not valid JSON/i.test(error.message)
  )
}
