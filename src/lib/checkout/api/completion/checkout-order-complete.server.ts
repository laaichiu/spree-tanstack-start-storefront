import '@tanstack/react-start/server-only'

import type {
  Client,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
} from '@spree/sdk'

import type { CheckoutCompletionResult } from '@/lib/checkout/utils/completion/checkout-completion-contract'
import { lookupCheckoutOrderWithCartCredentials } from './checkout-order-lookup'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { getCompletedOrderAccessToken } from '@/lib/cookies/completed-order-cookie.server'
import {
  recoverCheckoutCompletionResult,
  toCompletedCheckoutResourceResult,
} from './checkout-completion.server'
import { ensureCheckoutShippingRateForPaymentWithToken } from '../checkout-order-state.server'
import type { CheckoutShippingRateReference } from '@/lib/checkout/contracts'
import { getCheckoutCartRequestOptions } from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

type CompletedCheckoutResource = SpreeOrder | SpreeOrderGroup

async function completeCheckoutOrderResourceOnServer({
  cartId,
  client,
  requestOptions,
}: {
  cartId: string
  client: Client
  requestOptions: ReturnType<typeof getCheckoutCartRequestOptions>
}): Promise<CompletedCheckoutResource> {
  return client.carts.complete(cartId, requestOptions)
}

export async function completeCheckoutOrderOnServer({
  cartId,
  cartToken,
  market,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<CheckoutCompletionResult> {
  const client = getServerSpreeClientForMarket(market)
  const completedOrderToken = getCompletedOrderAccessToken(cartId)
  const expectedCurrentAccessToken = completedOrderToken ?? null
  let activeCartToken = cartToken
  let persistedCartToken = cartToken

  let preparation

  try {
    preparation = await ensureCheckoutShippingRateForPaymentWithToken({
      cartId,
      cartToken,
      expectedCurrentCartToken: cartToken,
      market,
      onCartTokenAvailable: (nextCartToken) => {
        activeCartToken = nextCartToken
        persistedCartToken = nextCartToken
      },
      selectedShippingRate,
    })
  } catch (error) {
    return recoverCheckoutCompletionResult({
      cartId,
      error,
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      fallbackToken: activeCartToken,
      lookupCompletedOrder: () =>
        lookupCheckoutOrderWithCartCredentials({
          cartId,
          cartToken: activeCartToken,
          completedOrderToken,
          client,
        }),
      market,
      orderIds: [cartId],
      expectedCurrentCartToken: persistedCartToken,
      expectedCurrentAccessToken,
    })
  }

  activeCartToken = preparation.cartToken
  persistedCartToken = preparation.persistedCartToken ?? persistedCartToken

  if (!preparation.checkoutOrder) {
    return recoverCheckoutCompletionResult({
      cartId,
      error: { code: 'completion_in_progress', status: 409 },
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      fallbackToken: activeCartToken,
      lookupCompletedOrder: () =>
        lookupCheckoutOrderWithCartCredentials({
          cartId,
          cartToken: preparation.cartToken,
          completedOrderToken,
          client,
        }),
      market,
      orderIds: [cartId],
      expectedCurrentCartToken: persistedCartToken,
      expectedCurrentAccessToken,
    })
  }

  let order: CompletedCheckoutResource

  try {
    order = await completeCheckoutOrderResourceOnServer({
      cartId,
      client,
      requestOptions: getCheckoutCartRequestOptions(preparation.cartToken),
    })
  } catch (error) {
    return recoverCheckoutCompletionResult({
      cartId,
      error,
      errorCode: 'order_complete_failed',
      fallbackMessage: 'Failed to complete order.',
      fallbackToken: activeCartToken,
      lookupCompletedOrder: () =>
        lookupCheckoutOrderWithCartCredentials({
          cartId,
          cartToken: activeCartToken,
          completedOrderToken,
          client,
        }),
      market,
      orderIds: [cartId],
      expectedCurrentCartToken: persistedCartToken,
      expectedCurrentAccessToken,
    })
  }

  return toCompletedCheckoutResourceResult({
    cartId,
    fallbackToken: activeCartToken,
    market,
    order,
    orderIds: [cartId],
    expectedCurrentCartToken: persistedCartToken,
    expectedCurrentAccessToken,
  })
}

export { completeCheckoutOrderResourceOnServer }
