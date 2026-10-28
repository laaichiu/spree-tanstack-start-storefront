import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { getCartQueryKey } from '../../cart/client/cart-query'
import { completeCheckoutOrder } from '../api/completion/checkout-completion.functions'
import {
  getCheckoutPaymentMutationKey,
  getCheckoutPaymentMutationScopeId,
} from './checkout-payment-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'

type ExpressCheckoutCompletionActionOptions = {
  cartId: string
  market: MarketSelectionInput
}

export function useExpressCheckoutCompletionActions({
  cartId,
  market,
}: ExpressCheckoutCompletionActionOptions) {
  const queryClient = useQueryClient()
  const completeOrderFn = useServerFn(completeCheckoutOrder)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const mutationKey = getCheckoutPaymentMutationKey({ cartId, market })
  const completeOrderMutation = useMutation({
    mutationKey,
    scope: { id: getCheckoutPaymentMutationScopeId({ cartId, market }) },
    mutationFn: (input: { selectedShippingRate?: CartShippingRate | null }) =>
      completeOrderFn({
        data: {
          cartId,
          market: marketInput,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: (result) => {
      if (result.success) {
        // Keep order completion independent from stale cart refreshes. The
        // completion result can be navigated to immediately.
        try {
          void queryClient
            .invalidateQueries({
              queryKey: getCartQueryKey({
                country: market.country,
                locale: market.locale,
              }),
            })
            .catch(() => undefined)
        } catch {
          // Cart refresh is a background follow-up after order completion.
        }
      }
    },
  })

  return {
    completeOrder: completeOrderMutation.mutateAsync,
  }
}
