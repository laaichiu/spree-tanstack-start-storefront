import { formatSpreeMoney } from '@/lib/runtime/spree-money'
import type { MoneyDisplayContext } from '@/lib/runtime/spree-money'
import type { Fulfillment as SpreeFulfillment } from '@spree/sdk'

import type { CheckoutFulfillment } from '@/lib/checkout/contracts'
import { readCheckoutText } from './checkout-text.mapper'

function getFulfillmentItemQuantity(fulfillment: SpreeFulfillment) {
  return fulfillment.items.reduce((total, item) => total + item.quantity, 0)
}

export function mapSpreeCheckoutFulfillment(
  fulfillment: SpreeFulfillment,
  context: MoneyDisplayContext,
): CheckoutFulfillment {
  return {
    displayCost: formatSpreeMoney(fulfillment.cost, context),
    fulfilledAt: fulfillment.fulfilled_at,
    id: fulfillment.id,
    itemQuantity: getFulfillmentItemQuantity(fulfillment),
    methodName: fulfillment.delivery_method.name,
    number: readCheckoutText(fulfillment.number),
    status: readCheckoutText(fulfillment.status),
    tracking: readCheckoutText(fulfillment.tracking),
    trackingUrl: readCheckoutText(fulfillment.tracking_url),
  }
}
