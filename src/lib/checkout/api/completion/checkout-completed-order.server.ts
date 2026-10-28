import '@tanstack/react-start/server-only'

import { assertCompletedCheckoutResourceMatchesMarket } from './checkout-completed-resource.server'

import { isOrderGroup } from '@spree/sdk'

import {
  getCustomerAccessToken,
  getCustomerRefreshToken,
} from '@/lib/cookies/auth-cookie.server'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import {
  mapSpreeCheckoutToOrder,
  mapSpreeOrderGroupToCheckoutOrder,
} from '@/lib/checkout/mappers/checkout.mapper'
import {
  getCompletedOrderAccessToken,
  getCompletedOrderGroupAccess,
} from '@/lib/cookies/completed-order-cookie.server'
import {
  assertSpreeCartResourceMatchesMarket,
  isCartMarketMismatchError,
} from '@/lib/cart/utils/cart-market'
import { withCustomerSession } from '@/lib/account/api/customer-session.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'
import {
  isCheckoutOrderResourceIdentityCompatible,
  isCheckoutOrderGroupResourceId,
} from '@/lib/checkout/utils/order-resource-identity'
import {
  getCompletedOrderLookupRequestOptions,
  getCustomerCompletedOrderLookupRequestOptions,
} from '@/lib/checkout/utils/completion/completed-order-access'

import { completedOrderExpand } from '../checkout-order-expands'
import type { CheckoutMarket } from '../checkout-session.server'

export async function readCompletedCheckoutOrder({
  market,
  orderId,
}: {
  market: CheckoutMarket
  orderId: string
}): Promise<CheckoutOrder | null> {
  const completedOrderToken = getCompletedOrderAccessToken(orderId)
  const client = getServerSpreeClientForMarket(market)

  const groupAccess = completedOrderToken
    ? getCompletedOrderGroupAccess(orderId)
    : undefined

  if (isCheckoutOrderGroupResourceId(orderId) && !groupAccess) return null

  const order = completedOrderToken
    ? await client.orders
        .get(
          orderId,
          {
            expand: completedOrderExpand,
          },
          getCompletedOrderLookupRequestOptions(completedOrderToken),
        )
        .catch(() => null)
    : null

  if (order && !isCheckoutOrderResourceIdentityCompatible(order, orderId)) {
    return null
  }

  if (order && isSpreeCompletedOrder(order)) {
    try {
      assertCompletedCheckoutResourceMatchesMarket(order, market)
    } catch (error) {
      if (isCartMarketMismatchError(error)) {
        return null
      }

      throw error
    }

    if (isOrderGroup(order)) {
      if (
        !groupAccess ||
        order.number !== groupAccess.number ||
        order.orders.length !== groupAccess.orderIds.length ||
        order.orders.some((member) => !groupAccess.orderIds.includes(member.id))
      )
        return null

      return mapSpreeOrderGroupToCheckoutOrder(order, { locale: market.locale })
    }

    return mapSpreeCheckoutToOrder(order, { locale: market.locale })
  }

  if (getCustomerAccessToken() || getCustomerRefreshToken()) {
    let customerOrderResource

    try {
      customerOrderResource = await withCustomerSession(
        async ({ client: sessionClient, token }) =>
          sessionClient.customer.orders.get(
            orderId,
            {
              expand: completedOrderExpand,
            },
            getCustomerCompletedOrderLookupRequestOptions(token),
          ),
        { client },
      )
    } catch {
      return null
    }

    if (
      !isCheckoutOrderResourceIdentityCompatible(customerOrderResource, orderId)
    ) {
      return null
    }

    if (!isSpreeCompletedOrder(customerOrderResource)) {
      return null
    }

    try {
      assertSpreeCartResourceMatchesMarket(customerOrderResource, market)
    } catch (error) {
      if (isCartMarketMismatchError(error)) {
        return null
      }

      throw error
    }

    return mapSpreeCheckoutToOrder(customerOrderResource, {
      locale: market.locale,
    })
  }

  return null
}
