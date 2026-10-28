import '@tanstack/react-start/server-only'

import { assertCompletedCheckoutResourceMatchesMarket } from './checkout-completed-resource.server'

import {
  getCheckoutOrderResourceId,
  getSelectedCheckoutShippingRate,
} from '@/lib/checkout/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { CheckoutCompletionResult } from '@/lib/checkout/utils/completion/checkout-completion-contract'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { getCompletedOrderAccessToken } from '@/lib/cookies/completed-order-cookie.server'
import {
  isCheckoutOrderResourceIdentityCompatible,
  isCheckoutOrderResourceIdentityMismatchError,
} from '@/lib/checkout/utils/order-resource-identity'
import {
  isCompletedCheckoutOrder,
  isSpreeCompletedOrder,
} from '@/lib/checkout/utils/payment/payment-completion'
import { isCompletedPaymentSessionStatus } from '@/lib/checkout/utils/payment/payment-session'
import {
  lookupCheckoutOrderWithCartCredentials,
  replayCompletedCheckoutGroupWithCartCredentials,
} from './checkout-order-lookup'

import { completeCheckoutPaymentSessionResourceOnServer } from '../payment/checkout-payment.server'
import {
  ensureCheckoutShippingRateForPaymentWithToken,
  readCheckoutOrderStateWithToken,
} from '../checkout-order-state.server'
import { getCheckoutCartRequestOptions } from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutOrderResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'
import { completeCheckoutOrderResourceOnServer } from './checkout-order-complete.server'

type ConfirmCheckoutPaymentInput = {
  adyenSessionId?: string
  cartId: string
  redirectResult?: string
  sessionId?: string
  sessionResult?: string
}

type CheckoutCompletionAction = () =>
  CheckoutCompletionResult | Promise<CheckoutCompletionResult>

type CheckoutCartTokenState = {
  activeCartToken?: string
  persistedCartToken?: string
}

function failedPaymentConfirmation(): CheckoutCompletionResult {
  return {
    error: 'Failed to confirm payment. Please try again.',
    errorCode: 'payment_confirmation_failed',
    order: null,
    success: false,
  }
}

async function confirmCheckoutPaymentSession({
  adyenSessionId,
  cartId,
  client,
  market,
  redirectResult,
  requestOptions,
  sessionId,
  sessionResult,
}: ConfirmCheckoutPaymentInput & {
  client: ReturnType<typeof getServerSpreeClientForMarket>
  market: CheckoutMarket
  requestOptions: ReturnType<typeof getCheckoutCartRequestOptions>
}): Promise<CheckoutCompletionResult | undefined> {
  if (sessionId) {
    const session = await completeCheckoutPaymentSessionResourceOnServer({
      cartId,
      client,
      errorFallback: 'Failed to confirm payment. Please try again.',
      payload:
        sessionResult || redirectResult
          ? {
              ...(sessionResult ? { session_result: sessionResult } : {}),
              ...(redirectResult
                ? { external_data: { redirect_result: redirectResult } }
                : {}),
            }
          : undefined,
      requestOptions,
      sessionId,
      market,
    })

    return isCompletedPaymentSessionStatus(session.status)
      ? undefined
      : {
          error: 'Payment was not successful. Please try again.',
          errorCode: 'payment_failed',
          success: false,
        }
  }

  if (!redirectResult) {
    return undefined
  }

  if (!adyenSessionId) {
    return {
      error: 'Payment session is not available.',
      errorCode: 'payment_session_not_ready',
      success: false,
    }
  }

  const session = await completeCheckoutPaymentSessionResourceOnServer({
    cartId,
    client,
    errorFallback: 'Failed to confirm payment. Please try again.',
    payload: { external_data: { redirect_result: redirectResult } },
    requestOptions,
    sessionId: adyenSessionId,
    market,
  })

  return isCompletedPaymentSessionStatus(session.status)
    ? undefined
    : {
        error: 'Payment was not successful. Please try again.',
        errorCode: 'payment_failed',
        success: false,
      }
}

async function prepareCheckoutPaymentCompletionAction({
  cartId,
  cartTokenState,
  checkoutOrder,
  client,
  completedOrderToken,
  data,
  expectedCurrentAccessToken,
  market,
}: {
  cartId: string
  cartTokenState: CheckoutCartTokenState
  checkoutOrder: CheckoutOrder
  client: ReturnType<typeof getServerSpreeClientForMarket>
  completedOrderToken?: string
  data: ConfirmCheckoutPaymentInput
  expectedCurrentAccessToken: string | null
  market: CheckoutMarket
}): Promise<CheckoutCompletionAction> {
  const paymentPreparation =
    await ensureCheckoutShippingRateForPaymentWithToken({
      cartId,
      cartToken: cartTokenState.activeCartToken,
      expectedCurrentCartToken: cartTokenState.activeCartToken,
      market,
      onCartTokenAvailable: (nextCartToken) => {
        cartTokenState.activeCartToken = nextCartToken
        cartTokenState.persistedCartToken = nextCartToken
      },
      selectedShippingRate:
        getSelectedCheckoutShippingRate(checkoutOrder) ?? undefined,
    })
  cartTokenState.activeCartToken = paymentPreparation.cartToken
  cartTokenState.persistedCartToken =
    paymentPreparation.persistedCartToken ?? cartTokenState.persistedCartToken

  const preparedCheckoutOrder = paymentPreparation.checkoutOrder

  if (!preparedCheckoutOrder) {
    return () =>
      recoverCheckoutCompletionResult({
        cartId,
        error: { code: 'completion_in_progress', status: 409 },
        errorCode: 'payment_confirmation_failed',
        fallbackMessage: 'Failed to confirm payment. Please try again.',
        fallbackToken: cartTokenState.activeCartToken,
        lookupCompletedOrder: () =>
          lookupCheckoutOrderWithCartCredentials({
            cartId,
            cartToken: paymentPreparation.cartToken,
            completedOrderToken,
            client,
          }),
        market,
        orderIds: [cartId],
        expectedCurrentCartToken: cartTokenState.persistedCartToken,
        expectedCurrentAccessToken,
      })
  }

  if (isCompletedCheckoutOrder(preparedCheckoutOrder)) {
    return () =>
      toCompletedCheckoutOrderResult({
        cartId,
        order: preparedCheckoutOrder,
        orderIds: [cartId, getCheckoutOrderResourceId(preparedCheckoutOrder)],
        orderToken: cartTokenState.activeCartToken,
        expectedCurrentCartToken: cartTokenState.persistedCartToken,
        expectedCurrentAccessToken,
      })
  }

  const paymentRequestOptions = getCheckoutCartRequestOptions(
    paymentPreparation.cartToken,
  )
  const paymentSessionResult = await confirmCheckoutPaymentSession({
    ...data,
    client,
    market,
    requestOptions: paymentRequestOptions,
  })

  if (paymentSessionResult) {
    return () => paymentSessionResult
  }

  const completedOrder = await completeCheckoutOrderResourceOnServer({
    cartId,
    client,
    requestOptions: paymentRequestOptions,
  })

  return () =>
    toCompletedCheckoutResourceResult({
      cartId,
      fallbackToken: cartTokenState.activeCartToken,
      market,
      order: completedOrder,
      orderIds: [cartId],
      expectedCurrentCartToken: cartTokenState.persistedCartToken,
      expectedCurrentAccessToken,
    })
}

async function recoverCompletedCheckoutAction({
  cartId,
  cartToken,
  client,
  completedOrderToken,
  expectedCurrentAccessToken,
  expectedCurrentCartToken,
  market,
}: {
  cartId: string
  cartToken?: string
  client: ReturnType<typeof getServerSpreeClientForMarket>
  completedOrderToken?: string
  expectedCurrentAccessToken: string | null
  expectedCurrentCartToken?: string
  market: CheckoutMarket
}): Promise<CheckoutCompletionAction> {
  const completedOrder = await lookupCheckoutOrderWithCartCredentials({
    cartId,
    cartToken,
    completedOrderToken,
    client,
  })

  if (
    completedOrder &&
    !isCheckoutOrderResourceIdentityCompatible(completedOrder, cartId)
  ) {
    return failedPaymentConfirmation
  }

  if (completedOrder) {
    assertCompletedCheckoutResourceMatchesMarket(completedOrder, market)
  }

  if (completedOrder && isSpreeCompletedOrder(completedOrder)) {
    return () =>
      toCompletedCheckoutResourceResult({
        cartId,
        fallbackToken: cartToken,
        market,
        order: completedOrder,
        orderIds: [cartId],
        expectedCurrentCartToken,
        expectedCurrentAccessToken,
      })
  }

  const completedGroup = await replayCompletedCheckoutGroupWithCartCredentials({
    cartId,
    cartToken: cartToken ?? completedOrderToken,
    client,
  })

  return completedGroup
    ? () =>
        toCompletedCheckoutResourceResult({
          cartId,
          fallbackToken: cartToken ?? completedOrderToken,
          market,
          order: completedGroup,
          orderIds: [cartId],
          expectedCurrentCartToken,
          expectedCurrentAccessToken,
        })
    : failedPaymentConfirmation
}

function recoverPaymentConfirmationErrorAction({
  cartId,
  cartTokenState,
  client,
  completedOrderToken,
  error,
  expectedCurrentAccessToken,
  market,
}: {
  cartId: string
  cartTokenState: CheckoutCartTokenState
  client: ReturnType<typeof getServerSpreeClientForMarket>
  completedOrderToken?: string
  error: unknown
  expectedCurrentAccessToken: string | null
  market: CheckoutMarket
}): CheckoutCompletionAction {
  return async () => {
    const recovered = await recoverCheckoutCompletionResult({
      cartId,
      error,
      errorCode: 'payment_confirmation_failed',
      fallbackMessage: 'Failed to confirm payment. Please try again.',
      fallbackToken: cartTokenState.activeCartToken,
      lookupCompletedOrder: () =>
        lookupCheckoutOrderWithCartCredentials({
          cartId,
          cartToken: cartTokenState.activeCartToken,
          completedOrderToken,
          client,
        }),
      market,
      orderIds: [cartId],
      expectedCurrentCartToken: cartTokenState.persistedCartToken,
      expectedCurrentAccessToken,
    })

    if (recovered.success) {
      return recovered
    }

    const completedGroup =
      await replayCompletedCheckoutGroupWithCartCredentials({
        cartId,
        cartToken: cartTokenState.activeCartToken ?? completedOrderToken,
        client,
      })

    return completedGroup
      ? toCompletedCheckoutResourceResult({
          cartId,
          fallbackToken: cartTokenState.activeCartToken ?? completedOrderToken,
          market,
          order: completedGroup,
          orderIds: [cartId],
          expectedCurrentCartToken: cartTokenState.persistedCartToken,
          expectedCurrentAccessToken,
        })
      : recovered
  }
}

export async function confirmCheckoutPaymentAndCompleteOrderOnServer({
  cartToken,
  market,
  ...data
}: ConfirmCheckoutPaymentInput & {
  cartToken?: string
  market: CheckoutMarket
}): Promise<CheckoutCompletionResult> {
  const client = getServerSpreeClientForMarket(market)
  const completedOrderToken = getCompletedOrderAccessToken(data.cartId)
  const expectedCurrentAccessToken = completedOrderToken ?? null
  const cartTokenState: CheckoutCartTokenState = {
    activeCartToken: cartToken,
    persistedCartToken: cartToken,
  }
  let completionAction: CheckoutCompletionAction | undefined

  // Keep mapping and cookie persistence outside this recovery boundary so
  // their failures reach the caller instead of triggering another lookup.
  try {
    const initialCheckoutState = await readCheckoutOrderStateWithToken({
      cartId: data.cartId,
      cartToken,
      expectedCurrentCartToken: cartToken,
      market,
    })
    const checkoutOrder = initialCheckoutState.checkoutOrder
    cartTokenState.activeCartToken = initialCheckoutState.cartToken
    cartTokenState.persistedCartToken =
      initialCheckoutState.persistedCartToken ??
      cartTokenState.persistedCartToken

    if (checkoutOrder && isCompletedCheckoutOrder(checkoutOrder)) {
      completionAction = () =>
        toCompletedCheckoutOrderResult({
          cartId: data.cartId,
          order: checkoutOrder,
          orderIds: [data.cartId, getCheckoutOrderResourceId(checkoutOrder)],
          orderToken: cartTokenState.activeCartToken,
          expectedCurrentCartToken: cartTokenState.persistedCartToken,
          expectedCurrentAccessToken,
        })
    } else if (!checkoutOrder) {
      completionAction = await recoverCompletedCheckoutAction({
        cartId: data.cartId,
        cartToken: cartTokenState.activeCartToken,
        completedOrderToken,
        client,
        expectedCurrentAccessToken,
        expectedCurrentCartToken: cartTokenState.persistedCartToken,
        market,
      })
    } else if (!data.sessionId && !data.redirectResult) {
      completionAction = failedPaymentConfirmation
    } else {
      completionAction = await prepareCheckoutPaymentCompletionAction({
        cartId: data.cartId,
        cartTokenState,
        checkoutOrder,
        client,
        completedOrderToken,
        data,
        expectedCurrentAccessToken,
        market,
      })
    }
  } catch (error) {
    if (isCheckoutOrderResourceIdentityMismatchError(error)) {
      return failedPaymentConfirmation()
    }

    completionAction = recoverPaymentConfirmationErrorAction({
      cartId: data.cartId,
      cartTokenState,
      client,
      completedOrderToken,
      error,
      expectedCurrentAccessToken,
      market,
    })
  }

  return completionAction()
}
