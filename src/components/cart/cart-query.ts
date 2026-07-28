import type { QueryClient } from '@tanstack/react-query'

import type { CartSummary } from '@/lib/cart/model/cart'

export const cartQueryKey = ['cart'] as const

export function getCartQueryKey({
  cartId,
  country,
  locale,
}: {
  cartId?: string
  country: string
  locale: string
}) {
  return cartId
    ? [...cartQueryKey, country, locale, cartId]
    : [...cartQueryKey, country, locale]
}

export function syncCartQueryData({
  cart,
  country,
  locale,
  queryClient,
}: {
  cart: CartSummary
  country: string
  locale: string
  queryClient: QueryClient
}) {
  queryClient.setQueryData(getCartQueryKey({ country, locale }), cart)
  queryClient.setQueryData(
    getCartQueryKey({ cartId: cart.id, country, locale }),
    cart,
  )
}
