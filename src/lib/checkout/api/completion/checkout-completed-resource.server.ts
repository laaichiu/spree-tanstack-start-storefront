import '@tanstack/react-start/server-only'

import { isOrderGroup } from '@spree/sdk'
import type {
  Cart as SpreeCart,
  Order as SpreeOrder,
  OrderGroup as SpreeOrderGroup,
} from '@spree/sdk'
import type { ResolvedMarket } from '@/lib/core/market'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import { assertCheckoutOrderGroupResponse } from '@/lib/checkout/mappers/checkout-order-group-response'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'
import {
  isCheckoutOrderGroupResourceId,
  isCheckoutOrderResourceId,
} from '@/lib/checkout/utils/order-resource-identity'

export function assertCompletedCheckoutResourceMatchesMarket(
  resource: SpreeCart | SpreeOrder | SpreeOrderGroup,
  market: Pick<ResolvedMarket, 'marketId' | 'currencyCode'>,
) {
  if (
    !isCheckoutOrderGroupResourceId(resource.id) &&
    !('orders' in resource && isOrderGroup(resource))
  ) {
    assertSpreeCartResourceMatchesMarket(resource, market)
    return
  }

  assertCheckoutOrderGroupResponse(resource)
  const orderGroup = resource

  if (!isSpreeCompletedOrder(orderGroup)) {
    throw new Error('The checkout completion response is not completed.')
  }

  if (orderGroup.currency !== market.currencyCode) {
    throw new Error('The completed order group contains mixed currencies.')
  }

  const childIds = new Set<string>()
  const childNumbers = new Set<string>()
  const childNumberPrefix = `${orderGroup.number}-`

  for (const order of orderGroup.orders) {
    const orderNumber: unknown = order.number
    const childNumber =
      typeof orderNumber === 'string'
        ? orderNumber.slice(childNumberPrefix.length)
        : ''

    // Spree moves cart_id to the OrderGroup when splitting the checkout.
    // Its children belong to this group through their numbered references.
    if (
      !isCheckoutOrderResourceId(order.id) ||
      childIds.has(order.id) ||
      order.currency !== orderGroup.currency ||
      order.cart_id !== null ||
      typeof orderNumber !== 'string' ||
      !orderNumber.startsWith(childNumberPrefix) ||
      !childNumber ||
      !/^[1-9]\d*$/.test(childNumber) ||
      childNumbers.has(orderNumber)
    ) {
      throw new Error(
        'The completed order group does not match the requested cart.',
      )
    }

    childIds.add(order.id)
    childNumbers.add(orderNumber)

    assertSpreeCartResourceMatchesMarket(order, market)

    if (!isSpreeCompletedOrder(order)) {
      throw new Error('The checkout completion response is not completed.')
    }
  }
}
