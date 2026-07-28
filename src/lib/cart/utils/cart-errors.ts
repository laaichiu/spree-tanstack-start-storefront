import { isSpreeErrorStatus } from '@/lib/spree/errors'

const RECOVERABLE_CART_COOKIE_STATUSES = [401, 403, 404] as const

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
