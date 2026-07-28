import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'

import {
  addToCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/cart/api/cart-item.functions'
import { getCart } from '@/lib/cart/api/cart-read.functions'
import { resetCartSession } from '@/lib/cart/api/cart-session.functions'
import type { CartSummary } from '@/lib/cart/model/cart'

import { cartQueryKey, getCartQueryKey, syncCartQueryData } from './cart-query'

type UseCartOptions = {
  cartId?: string
  enabled?: boolean
  initialCart?: CartSummary | null
  retry?: boolean | number
  refetchOnMount?: boolean | 'always'
  staleTime?: number
}

export function useCart({
  cartId,
  enabled = true,
  initialCart,
  retry,
  refetchOnMount,
  staleTime,
}: UseCartOptions = {}) {
  const { market } = useMarket()
  const getCartFn = useServerFn(getCart)

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
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
  })
}

export function useAddToCart() {
  const { market } = useMarket()
  const addToCartFn = useServerFn(addToCart)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { quantity: number; variantId: string }) =>
      addToCartFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
          quantity: input.quantity,
          variantId: input.variantId,
        },
      }),
    onSuccess: (cart) => {
      syncCartQueryData({
        cart,
        country: market.country,
        locale: market.locale,
        queryClient,
      })
    },
  })
}

export function useUpdateCartItem() {
  const { market } = useMarket()
  const updateCartItemFn = useServerFn(updateCartItem)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { lineItemId: string; quantity: number }) =>
      updateCartItemFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
          lineItemId: input.lineItemId,
          quantity: input.quantity,
        },
      }),
    onSuccess: (cart) => {
      syncCartQueryData({
        cart,
        country: market.country,
        locale: market.locale,
        queryClient,
      })
    },
  })
}

export function useRemoveCartItem() {
  const { market } = useMarket()
  const removeCartItemFn = useServerFn(removeCartItem)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { lineItemId: string }) =>
      removeCartItemFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
          lineItemId: input.lineItemId,
        },
      }),
    onSuccess: (cart) => {
      syncCartQueryData({
        cart,
        country: market.country,
        locale: market.locale,
        queryClient,
      })
    },
  })
}

export function useResetCartSession() {
  const resetCartSessionFn = useServerFn(resetCartSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => resetCartSessionFn(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cartQueryKey,
      })
    },
  })
}
