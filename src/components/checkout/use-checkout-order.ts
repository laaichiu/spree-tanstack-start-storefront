import { useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { cartQueryKey, getCartQueryKey } from '@/components/cart/cart-query'
import { useMarket } from '@/components/layout/market-provider'

import { getCheckoutCart } from '@/lib/checkout/api/checkout-order.functions'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

export const checkoutOrderQueryKey = ['checkout'] as const

type UseCheckoutOrderOptions = {
  cartId?: string
  enabled?: boolean
  initialOrder?: CheckoutOrder | null
  refetchOnMount?: boolean | 'always'
  staleTime?: number
}

export function getCheckoutOrderQueryKey({
  cartId,
  country,
  locale,
}: {
  cartId?: string
  country: string
  locale: string
}) {
  return cartId
    ? [...checkoutOrderQueryKey, country, locale, cartId]
    : [...checkoutOrderQueryKey, country, locale]
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
  queryClient.setQueryData(
    getCartQueryKey({
      cartId: order.id,
      country,
      locale,
    }),
    order,
  )
  queryClient.setQueryData([...cartQueryKey, country, locale], order)
}

export function useCheckoutOrder({
  cartId,
  enabled = true,
  initialOrder,
  refetchOnMount,
  staleTime,
}: UseCheckoutOrderOptions = {}) {
  const { market } = useMarket()
  const getCheckoutCartFn = useServerFn(getCheckoutCart)

  return useQuery({
    enabled: enabled && Boolean(cartId),
    initialData: initialOrder,
    queryKey: getCheckoutOrderQueryKey({
      cartId,
      country: market.country,
      locale: market.locale,
    }),
    refetchOnMount,
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
