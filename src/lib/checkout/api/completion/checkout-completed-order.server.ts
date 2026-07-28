import '@tanstack/react-start/server-only'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getCompletedOrderAccessToken } from '@/lib/cookies/completed-order-cookie.server'
import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'
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
  const customerToken = getCustomerAccessToken()
  const client = getServerSpreeClientForMarket(market)
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

  if (order && isSpreeCompletedOrder(order)) {
    return mapSpreeCheckoutToOrder(order)
  }

  if (customerToken) {
    const customerOrder = await client.customer.orders
      .get(
        orderId,
        {
          expand: completedOrderExpand,
        },
        getCustomerCompletedOrderLookupRequestOptions(customerToken),
      )
      .catch(() => null)

    if (customerOrder && isSpreeCompletedOrder(customerOrder)) {
      return mapSpreeCheckoutToOrder(customerOrder)
    }
  }

  return null
}
