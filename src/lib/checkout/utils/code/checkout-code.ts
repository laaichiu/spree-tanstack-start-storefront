import { isSpreeErrorStatus, readSpreeErrorCode } from '@/lib/spree/errors'

const GIFT_CARD_NOT_FOUND_CODES = new Set([
  'gift_card_not_found',
  'record_not_found',
])

export function shouldTryGiftCardAfterDiscountCodeError(error: unknown) {
  return isSpreeErrorStatus(error, [404, 422])
}

export function shouldPreferDiscountCodeErrorAfterGiftCardError(
  error: unknown,
) {
  const code = readSpreeErrorCode(error)

  return Boolean(code && GIFT_CARD_NOT_FOUND_CODES.has(code))
}

export function readCheckoutCodeErrorMessage(
  error: unknown,
  fallback = 'The entered code is not valid.',
) {
  return error instanceof Error && error.message ? error.message : fallback
}
