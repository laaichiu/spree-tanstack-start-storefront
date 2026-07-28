import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'
import {
  resolveExpressCheckoutShipping,
  selectExpressCheckoutShippingRates,
} from '@/lib/checkout/api/express/checkout-express-shipping.functions'
import type { ExpressCheckoutOrderResult } from '@/lib/checkout/api/express/checkout-express.types'
import { syncCheckoutOrderQueryData } from '../use-checkout-order'

export type ExpressCheckoutPartialAddressInput = {
  city: string
  countryIso: string
  postalCode: string
  stateAbbr?: string
  stateName?: string
}

export type ExpressCheckoutRateSelectionInput = {
  fulfillmentId: string
  rateId: string
}

type ExpressCheckoutShippingActionResult = ExpressCheckoutOrderResult

export function useExpressCheckoutShippingActions({
  cartId,
}: {
  cartId: string
}) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const resolveShippingFn = useServerFn(resolveExpressCheckoutShipping)
  const selectShippingRatesFn = useServerFn(selectExpressCheckoutShippingRates)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  const syncOrder = (result: ExpressCheckoutShippingActionResult) => {
    if (result.success) {
      syncCheckoutOrderQueryData({
        country: market.country,
        locale: market.locale,
        order: result.order,
        queryClient,
      })
    }
  }

  return {
    async resolveShipping(address: ExpressCheckoutPartialAddressInput) {
      const result = await resolveShippingFn({
        data: {
          address,
          cartId,
          market: marketInput,
        },
      })

      syncOrder(result)
      return result
    },
    async selectShippingRates(selections: ExpressCheckoutRateSelectionInput[]) {
      const result = await selectShippingRatesFn({
        data: {
          cartId,
          market: marketInput,
          selections,
        },
      })

      syncOrder(result)
      return result
    },
  }
}
