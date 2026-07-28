import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { cartQueryKey } from '@/components/cart/cart-query'
import { useMarket } from '@/components/layout/market-provider'
import { completeCheckoutOrder } from '@/lib/checkout/api/completion/checkout-completion.functions'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'

export function useExpressCheckoutCompletionActions({
  cartId,
}: {
  cartId: string
}) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const completeOrderFn = useServerFn(completeCheckoutOrder)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  return {
    async completeOrder(input: {
      selectedShippingRate?: CartShippingRate | null
    }) {
      const result = await completeOrderFn({
        data: {
          cartId,
          market: marketInput,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      })

      if (result.success) {
        // Keep order completion independent from stale cart refreshes. The
        // completion result can be navigated to immediately.
        void queryClient.invalidateQueries({
          queryKey: cartQueryKey,
        })
      }

      return result
    },
  }
}
