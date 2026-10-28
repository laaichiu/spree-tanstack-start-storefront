import type {
  Cart as SpreeCart,
  DeliveryRate as SpreeDeliveryRate,
  Fulfillment as SpreeFulfillment,
  Order as SpreeOrder,
} from '@spree/sdk'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type { Money } from '@/lib/core/money'
import { mapSpreeAmountToMoney } from '@/lib/money/map-spree-amount'

type SpreeCartOrOrder = SpreeCart | SpreeOrder

function readFulfillments(cart: SpreeCartOrOrder): SpreeFulfillment[] {
  return 'fulfillments' in cart && Array.isArray(cart.fulfillments)
    ? cart.fulfillments
    : []
}

function mapShippingRate({
  currencyCode,
  fulfillment,
  rate,
}: {
  currencyCode: string
  fulfillment: SpreeFulfillment
  rate: SpreeDeliveryRate
}): CartShippingRate {
  const displayPrice = mapSpreeAmountToMoney(rate.cost, currencyCode)
  const price = mapSpreeAmountToMoney(rate.total, currencyCode)

  if (!displayPrice || !price) {
    throw new Error('The shipping rate amount is unavailable.')
  }

  return {
    deliveryMethodId: rate.delivery_method_id,
    id: rate.id,
    fulfillmentId: fulfillment.id,
    name: rate.name,
    selected: rate.selected,
    displayPrice,
    price,
  }
}

export function mapSpreeShippingRates(
  cart: SpreeCartOrOrder,
): CartShippingRate[] {
  return readFulfillments(cart).flatMap((fulfillment) =>
    fulfillment.delivery_rates.map((rate) =>
      mapShippingRate({
        currencyCode: cart.currency,
        fulfillment,
        rate,
      }),
    ),
  )
}

export function mapSpreeShippingDiscountTotal(
  cart: SpreeCartOrOrder,
): Money | null {
  const fulfillments = readFulfillments(cart)

  if (fulfillments.some((fulfillment) => fulfillment.discount_total === null)) {
    return null
  }

  return fulfillments.reduce<Money | null>(
    (total, fulfillment) => {
      if (!total) {
        return null
      }

      const discountTotal = mapSpreeAmountToMoney(
        fulfillment.discount_total,
        cart.currency,
      )

      if (!discountTotal) {
        return null
      }

      return {
        amount: total.amount + discountTotal.amount,
        currencyCode: total.currencyCode,
      }
    },
    {
      amount: 0,
      currencyCode: cart.currency,
    },
  )
}
