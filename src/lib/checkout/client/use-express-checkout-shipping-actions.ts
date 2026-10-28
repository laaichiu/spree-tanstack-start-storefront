import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import type {
  ExpressCheckoutPartialAddressInput,
  ExpressCheckoutRateSelectionInput,
} from '../utils/express/express-checkout-actions'

import {
  resolveExpressCheckoutShipping,
  selectExpressCheckoutShippingRates,
} from '../api/express/checkout-express-shipping.functions'
import type { ExpressCheckoutOrderResult } from '../api/express/checkout-express.types'
import {
  getCheckoutMutationKey,
  getCheckoutMutationScopeId,
} from './checkout-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'
import { syncCheckoutOrderQueryData } from './use-checkout-order'

export type {
  ExpressCheckoutPartialAddressInput,
  ExpressCheckoutRateSelectionInput,
} from '../utils/express/express-checkout-actions'

export type { ExpressCheckoutOrderResult }

type ExpressCheckoutShippingActionOptions = {
  cartId: string
  market: MarketSelectionInput
}

export function useExpressCheckoutShippingActions({
  cartId,
  market,
}: ExpressCheckoutShippingActionOptions) {
  const queryClient = useQueryClient()
  const resolveShippingFn = useServerFn(resolveExpressCheckoutShipping)
  const selectShippingRatesFn = useServerFn(selectExpressCheckoutShippingRates)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const mutationKey = getCheckoutMutationKey({ cartId, market })

  const syncOrder = (result: ExpressCheckoutOrderResult) => {
    if (!result.success) {
      return
    }

    syncCheckoutOrderQueryData({
      country: market.country,
      locale: market.locale,
      order: result.order,
      queryClient,
    })
  }
  const resolveShippingMutation = useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (address: ExpressCheckoutPartialAddressInput) =>
      resolveShippingFn({
        data: {
          address,
          cartId,
          market: marketInput,
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: syncOrder,
  })
  const selectShippingRatesMutation = useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (selections: ExpressCheckoutRateSelectionInput[]) =>
      selectShippingRatesFn({
        data: {
          cartId,
          market: marketInput,
          selections,
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: syncOrder,
  })

  return {
    resolveShipping: resolveShippingMutation.mutateAsync,
    selectShippingRates: selectShippingRatesMutation.mutateAsync,
  }
}
