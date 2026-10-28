import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { CartSummary } from '@/lib/cart/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { getCart } from '../api/cart-read.functions'
import { getCartQueryKey } from './cart-query'

type UseCartOptions = {
  cartId?: string
  enabled?: boolean
  initialCart?: CartSummary | null
  market: MarketSelectionInput
  retry?: boolean | number
  refetchOnMount?: boolean | 'always'
  staleTime?: number
}

export function useCart({
  cartId,
  enabled = true,
  initialCart,
  market,
  retry,
  refetchOnMount,
  staleTime,
}: UseCartOptions) {
  const getCartFn = useServerFn(getCart)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  return useQuery({
    enabled,
    initialData: initialCart,
    queryKey: getCartQueryKey({
      cartId,
      country: market.country,
      locale: market.locale,
    }),
    retry,
    refetchOnMount,
    staleTime,
    queryFn: () =>
      getCartFn({
        data: {
          cartId,
          market: marketInput,
        },
      }),
  })
}
