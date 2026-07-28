import { useMemo } from 'react'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { getSelectedCheckoutShippingRate } from '@/lib/checkout/utils/shipping/shipping-rate-selection'

export function useCheckoutSelectedShippingRate(
  order: CheckoutOrder,
): CartShippingRate | null {
  const selectedShippingRate = getSelectedCheckoutShippingRate(order)
  const hasSelectedShippingRate = Boolean(selectedShippingRate)
  const deliveryMethodId = selectedShippingRate?.deliveryMethodId ?? ''
  const fulfillmentId = selectedShippingRate?.fulfillmentId ?? ''
  const id = selectedShippingRate?.id ?? ''
  const name = selectedShippingRate?.name ?? ''
  const displayPriceAmount = selectedShippingRate?.displayPrice.amount ?? 0
  const displayPriceCurrencyCode =
    selectedShippingRate?.displayPrice.currencyCode ?? ''
  const priceAmount = selectedShippingRate?.price.amount ?? 0
  const priceCurrencyCode = selectedShippingRate?.price.currencyCode ?? ''

  return useMemo(
    () =>
      hasSelectedShippingRate
        ? {
            deliveryMethodId,
            fulfillmentId,
            id,
            name,
            displayPrice: {
              amount: displayPriceAmount,
              currencyCode: displayPriceCurrencyCode,
            },
            price: {
              amount: priceAmount,
              currencyCode: priceCurrencyCode,
            },
            selected: true,
          }
        : null,
    [
      deliveryMethodId,
      displayPriceAmount,
      displayPriceCurrencyCode,
      fulfillmentId,
      hasSelectedShippingRate,
      id,
      name,
      priceAmount,
      priceCurrencyCode,
    ],
  )
}
