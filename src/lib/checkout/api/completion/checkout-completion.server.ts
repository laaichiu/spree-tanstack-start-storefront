import '@tanstack/react-start/server-only'

import { isOrderGroup } from '@spree/sdk'
import type {
  Cart as SpreeCart,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
} from '@spree/sdk'

import { assertCompletedCheckoutResourceMatchesMarket } from '@/lib/checkout/api/completion/checkout-completed-resource.server'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type {
  CheckoutCompletionErrorCode,
  CheckoutCompletionResult,
} from '@/lib/checkout/utils/completion/checkout-completion-contract'
import { isCartMarketMismatchError } from '@/lib/cart/utils/cart-market'
import {
  mapSpreeCheckoutToOrder,
  mapSpreeOrderGroupToCheckoutOrder,
} from '@/lib/checkout/mappers/checkout.mapper'
import {
  isRecoverableCheckoutCompletionError,
  isSpreeCompletedOrder,
} from '@/lib/checkout/utils/payment/payment-completion'
import { readSafePaymentSessionErrorMessage } from '@/lib/checkout/utils/payment/payment-session'
import {
  assertCheckoutOrderResourceMatchesRequestedId,
  isCheckoutOrderResourceIdentityCompatible,
} from '@/lib/checkout/utils/order-resource-identity'

import {
  clearCheckoutCartCookiesIfOwnedByCart,
  persistCompletedOrderAccess,
  persistCompletedOrderGroupResourceAccess,
  persistCompletedOrderResourceAccess,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

type CompletedCheckoutResource = SpreeCart | SpreeOrder | SpreeOrderGroup

type CheckoutCompletionRecoverableErrorCode = Extract<
  CheckoutCompletionErrorCode,
  'order_complete_failed' | 'payment_confirmation_failed'
>

export function toCompletedCheckoutOrderResult({
  cartId,
  order,
  orderIds,
  orderToken,
  expectedCurrentCartToken,
  expectedCurrentAccessToken,
}: {
  cartId: string
  order: CheckoutOrder
  orderIds: string[]
  orderToken?: string
  expectedCurrentCartToken?: string
  expectedCurrentAccessToken?: string | null
}): CheckoutCompletionResult {
  persistCompletedOrderAccess({
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
    orderIds,
    orderToken,
  })
  clearCompletedCheckoutCartCookies(cartId, expectedCurrentCartToken)

  return {
    order,
    success: true,
  }
}

export function toCompletedCheckoutResourceResult({
  cartId,
  fallbackToken,
  market,
  order,
  orderIds,
  expectedCurrentCartToken,
  expectedCurrentAccessToken,
}: {
  cartId: string
  fallbackToken?: string
  market: CheckoutMarket
  order: CompletedCheckoutResource
  orderIds: string[]
  expectedCurrentCartToken?: string
  expectedCurrentAccessToken?: string | null
}): CheckoutCompletionResult {
  if (isCompletedOrderGroup(order)) {
    return toCompletedCheckoutOrderGroupResult({
      cartId,
      fallbackToken,
      market,
      orderGroup: order,
      expectedCurrentAccessToken,
      expectedCurrentCartToken,
    })
  }

  assertCheckoutOrderResourceMatchesRequestedId(order, cartId)
  assertCompletedCheckoutResourceMatchesMarket(order, market)

  if (!isSpreeCompletedOrder(order)) {
    throw new Error('The checkout completion response is not completed.')
  }

  const mappedOrder = mapSpreeCheckoutToOrder(order, { locale: market.locale })

  persistCompletedOrderResourceAccess({
    fallbackToken,
    order,
    orderIds,
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
  })
  clearCompletedCheckoutCartCookies(cartId, expectedCurrentCartToken)

  return {
    order: mappedOrder,
    success: true,
  }
}

function toCompletedCheckoutOrderGroupResult({
  cartId,
  fallbackToken,
  market,
  orderGroup,
  expectedCurrentCartToken,
  expectedCurrentAccessToken,
}: {
  cartId: string
  fallbackToken?: string
  market: CheckoutMarket
  orderGroup: SpreeOrderGroup
  expectedCurrentCartToken?: string
  expectedCurrentAccessToken?: string | null
}): CheckoutCompletionResult {
  assertCompletedCheckoutResourceMatchesMarket(orderGroup, market)

  const mappedOrder = mapSpreeOrderGroupToCheckoutOrder(orderGroup, {
    locale: market.locale,
  })
  const childOrderIds = orderGroup.orders.map((order) => order.id)

  persistCompletedOrderGroupResourceAccess({
    cartId,
    fallbackToken,
    groupId: orderGroup.id,
    groupNumber: orderGroup.number,
    orderIds: childOrderIds,
    ...(expectedCurrentAccessToken !== undefined
      ? { expectedCurrentAccessToken }
      : {}),
  })
  clearCompletedCheckoutCartCookies(cartId, expectedCurrentCartToken)

  return {
    order: mappedOrder,
    success: true,
  }
}

export async function recoverCheckoutCompletionResult({
  cartId,
  error,
  errorCode,
  fallbackMessage,
  fallbackToken,
  lookupCompletedOrder,
  market,
  orderIds,
  expectedCurrentCartToken,
  expectedCurrentAccessToken,
}: {
  cartId: string
  error: unknown
  errorCode: CheckoutCompletionRecoverableErrorCode
  fallbackMessage: string
  fallbackToken?: string
  lookupCompletedOrder: () => Promise<CompletedCheckoutResource | null>
  market: CheckoutMarket
  orderIds: string[]
  expectedCurrentCartToken?: string
  expectedCurrentAccessToken?: string | null
}): Promise<CheckoutCompletionResult> {
  if (isRecoverableCheckoutCompletionError(error)) {
    let order: CompletedCheckoutResource | null = null

    try {
      order = await lookupCompletedOrder()
    } catch {
      return {
        error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
        errorCode,
        order: null,
        success: false,
      }
    }

    if (order && !isCheckoutOrderResourceIdentityCompatible(order, cartId)) {
      return {
        error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
        errorCode,
        order: null,
        success: false,
      }
    }

    if (order) {
      try {
        assertCompletedCheckoutResourceMatchesMarket(order, market)
      } catch (marketError) {
        if (isCartMarketMismatchError(marketError)) {
          return {
            error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
            errorCode,
            order: null,
            success: false,
          }
        }

        throw marketError
      }
    }

    if (order && isSpreeCompletedOrder(order)) {
      return toCompletedCheckoutResourceResult({
        cartId,
        fallbackToken,
        market,
        order,
        orderIds,
        ...(expectedCurrentCartToken !== undefined
          ? { expectedCurrentCartToken }
          : {}),
        ...(expectedCurrentAccessToken !== undefined
          ? { expectedCurrentAccessToken }
          : {}),
      })
    }

    return {
      error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
      errorCode,
      order: null,
      success: false,
    }
  }

  return {
    error: readSafePaymentSessionErrorMessage(error, fallbackMessage),
    errorCode,
    success: false,
  }
}

function clearCompletedCheckoutCartCookies(
  cartId: string,
  expectedCurrentCartToken?: string,
) {
  if (expectedCurrentCartToken === undefined) {
    clearCheckoutCartCookiesIfOwnedByCart(cartId)
    return
  }

  clearCheckoutCartCookiesIfOwnedByCart(
    cartId,
    undefined,
    expectedCurrentCartToken,
  )
}

function isCompletedOrderGroup(
  resource: CompletedCheckoutResource,
): resource is SpreeOrderGroup {
  return 'orders' in resource && isOrderGroup(resource)
}
