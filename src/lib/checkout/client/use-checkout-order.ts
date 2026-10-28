import { useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import type { CheckoutOrder } from '@/lib/checkout/contracts'

import { syncCartQueryData } from '../../cart/client/cart-query'
import { getCheckoutCart } from '../api/checkout-order.functions'

import { getCheckoutOrderQueryKey } from './checkout-query'

export {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
  getCheckoutOrderQueryKey,
  getCheckoutOrderSnapshotQueryKey,
} from './checkout-query'

type UseCheckoutOrderOptions = {
  cartId?: string
  enabled?: boolean
  initialOrder?: CheckoutOrder | null
  market: MarketSelectionInput
  queryKey?: readonly unknown[]
  refetchOnMount?: boolean | 'always'
  retry?: boolean | number
  staleTime?: number
}

export function syncCheckoutOrderQueryData({
  country,
  locale,
  order,
  queryClient,
}: {
  country: string
  locale: string
  order: CheckoutOrder
  queryClient: QueryClient
}) {
  queryClient.setQueryData(
    getCheckoutOrderQueryKey({
      cartId: order.id,
      country,
      locale,
    }),
    order,
  )
  syncCartQueryData({
    cart: order,
    country,
    locale,
    queryClient,
  })
}

export function useCheckoutOrder({
  cartId,
  enabled = true,
  initialOrder,
  market,
  queryKey,
  refetchOnMount,
  retry,
  staleTime,
}: UseCheckoutOrderOptions) {
  const getCheckoutCartFn = useServerFn(getCheckoutCart)

  return useQuery({
    enabled: enabled && Boolean(cartId),
    initialData: initialOrder,
    queryKey:
      queryKey ??
      getCheckoutOrderQueryKey({
        cartId,
        country: market.country,
        locale: market.locale,
      }),
    refetchOnMount,
    retry,
    staleTime,
    queryFn: () => {
      if (!cartId) {
        return null
      }

      return getCheckoutCartFn({
        data: {
          cartId,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      })
    },
  })
}
