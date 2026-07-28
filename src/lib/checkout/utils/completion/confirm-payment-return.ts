import type {
  CheckoutCompletionErrorCode,
  CheckoutCompletionResult,
} from '@/lib/checkout/model/checkout'
import type { CheckoutPaymentReturnSearch } from '@/lib/checkout/utils/completion/payment-return'

type ConfirmPaymentMarketParams = {
  cartId: string
  country: string
  locale: string
}

export type ConfirmCheckoutPaymentInputData = {
  adyenSessionId?: string
  cartId: string
  market: {
    country: string
    locale: string
  }
  redirectResult?: string
  sessionId?: string
  sessionResult?: string
}

export type ConfirmPaymentOrderPlacedNavigation = {
  kind: 'order_placed'
  params: {
    country: string
    id: string
    locale: string
  }
  to: '/$country/$locale/order-placed/$id'
}

export type ConfirmPaymentCheckoutNavigation = {
  error?: string
  errorCode?: CheckoutCompletionErrorCode
  kind: 'checkout'
  params: {
    country: string
    id: string
    locale: string
  }
  search: {
    payment_error: string | undefined
    payment_error_code: CheckoutCompletionErrorCode | undefined
  }
  to: '/$country/$locale/checkout/$id'
}

export type ConfirmPaymentNavigation =
  | ConfirmPaymentCheckoutNavigation
  | ConfirmPaymentOrderPlacedNavigation

export function buildConfirmCheckoutPaymentInputData({
  cartId,
  country,
  locale,
  redirectResult,
  session,
  sessionId,
  sessionResult,
}: ConfirmPaymentMarketParams &
  CheckoutPaymentReturnSearch): ConfirmCheckoutPaymentInputData {
  return {
    adyenSessionId: sessionId,
    cartId,
    market: {
      country,
      locale,
    },
    redirectResult,
    sessionId: session,
    sessionResult,
  }
}

export function getConfirmPaymentResultNavigation({
  cartId,
  country,
  locale,
  result,
}: ConfirmPaymentMarketParams & {
  result: CheckoutCompletionResult
}): ConfirmPaymentNavigation {
  if (result.success) {
    return {
      kind: 'order_placed',
      params: {
        country,
        id: result.order?.id ?? cartId,
        locale,
      },
      to: '/$country/$locale/order-placed/$id',
    }
  }

  return getConfirmPaymentCheckoutNavigation({
    cartId,
    country,
    error: result.error,
    errorCode: result.errorCode ?? 'payment_failed',
    locale,
  })
}

export function getConfirmPaymentExceptionNavigation({
  cartId,
  country,
  error,
  locale,
}: ConfirmPaymentMarketParams & {
  error: unknown
}): ConfirmPaymentCheckoutNavigation {
  return getConfirmPaymentCheckoutNavigation({
    cartId,
    country,
    error: error instanceof Error && error.message ? error.message : undefined,
    errorCode: 'payment_failed',
    locale,
  })
}

function getConfirmPaymentCheckoutNavigation({
  cartId,
  country,
  error,
  errorCode,
  locale,
}: ConfirmPaymentMarketParams & {
  error?: string
  errorCode?: CheckoutCompletionErrorCode
}): ConfirmPaymentCheckoutNavigation {
  return {
    error,
    errorCode,
    kind: 'checkout',
    params: {
      country,
      id: cartId,
      locale,
    },
    search: {
      payment_error: errorCode ? undefined : error,
      payment_error_code: errorCode,
    },
    to: '/$country/$locale/checkout/$id',
  }
}
