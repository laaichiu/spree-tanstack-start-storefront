import type { MessageKey } from '@/lib/i18n/messages'

import type { CheckoutCompletionErrorCode } from '../../model/checkout'

const checkoutCompletionErrorCodes = [
  'order_complete_failed',
  'payment_confirmation_failed',
  'payment_failed',
  'payment_session_not_ready',
  'payment_submit_failed',
] as const satisfies readonly CheckoutCompletionErrorCode[]

const checkoutCompletionErrorMessageKeys = {
  order_complete_failed: 'checkout.orderCompleteFailed',
  payment_confirmation_failed: 'checkout.paymentConfirmationFailed',
  payment_failed: 'checkout.paymentFailed',
  payment_session_not_ready: 'checkout.paymentSessionNotReady',
  payment_submit_failed: 'checkout.paymentSubmitFailed',
} satisfies Record<CheckoutCompletionErrorCode, MessageKey>

export function isCheckoutCompletionErrorCode(
  value: unknown,
): value is CheckoutCompletionErrorCode {
  return (
    typeof value === 'string' &&
    checkoutCompletionErrorCodes.includes(value as CheckoutCompletionErrorCode)
  )
}

function readSearchString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function parseCheckoutPaymentErrorSearch(
  search: Record<string, unknown>,
) {
  return {
    payment_error: readSearchString(search.payment_error),
    payment_error_code: isCheckoutCompletionErrorCode(search.payment_error_code)
      ? search.payment_error_code
      : undefined,
  }
}

export function getCheckoutCompletionErrorMessageKey(
  code: CheckoutCompletionErrorCode,
) {
  return checkoutCompletionErrorMessageKeys[code]
}

export function getCheckoutCompletionErrorMessage({
  error,
  errorCode,
  t,
}: {
  error?: string | null
  errorCode?: CheckoutCompletionErrorCode | null
  t: (key: MessageKey) => string
}) {
  if (errorCode) {
    return t(getCheckoutCompletionErrorMessageKey(errorCode))
  }

  return error || t('checkout.paymentFailed')
}

type CheckoutPaymentErrorInput = {
  error?: string | null
  errorCode?: CheckoutCompletionErrorCode | null
}

export function getCheckoutPaymentErrorSignature({
  error,
  errorCode,
}: CheckoutPaymentErrorInput) {
  if (!error && !errorCode) {
    return null
  }

  return [errorCode ?? '', error ?? ''].join(':')
}

export function getCheckoutPaymentErrorNotice({
  appliedSignature = null,
  error,
  errorCode,
  t,
}: CheckoutPaymentErrorInput & {
  appliedSignature?: string | null
  t: (key: MessageKey) => string
}) {
  const signature = getCheckoutPaymentErrorSignature({ error, errorCode })

  if (!signature || signature === appliedSignature) {
    return null
  }

  return {
    message: getCheckoutCompletionErrorMessage({ error, errorCode, t }),
    signature,
  }
}
