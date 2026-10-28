import type { CartShippingRate } from '@/lib/cart/contracts'

import { toStripeMinorUnit } from './express-checkout-currency'

export type ExpressCheckoutRateSelection = {
  fulfillmentId: string
  rateId: string
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

export function buildExpressCheckoutShippingRateMap({
  isGooglePay,
  rates,
}: {
  isGooglePay: boolean
  rates: CartShippingRate[]
}) {
  const rateMap = new Map<
    string,
    { amount: number; displayName: string; id: string }
  >()
  const selectionMap = new Map<string, ExpressCheckoutRateSelection[]>()

  for (const rate of rates) {
    const groupId = rate.deliveryMethodId || rate.id
    const existingRate = rateMap.get(groupId)

    if (!existingRate) {
      const stripeRateId = isGooglePay
        ? `${groupId}-${randomSuffix()}`
        : groupId

      rateMap.set(groupId, {
        amount: toStripeMinorUnit(rate.price),
        displayName: rate.name,
        id: stripeRateId,
      })
      selectionMap.set(stripeRateId, [
        {
          fulfillmentId: rate.fulfillmentId,
          rateId: rate.id,
        },
      ])
      continue
    }

    existingRate.amount += toStripeMinorUnit(rate.price)
    selectionMap.get(existingRate.id)?.push({
      fulfillmentId: rate.fulfillmentId,
      rateId: rate.id,
    })
  }

  return {
    selectionMap,
    shippingRates: Array.from(rateMap.values()),
  }
}
