import type { QueryClient } from '@tanstack/react-query'

import type { CartSummary } from '@/lib/cart/contracts'

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
  handoverFromCart,
  locale,
  queryClient,
}: {
  cart: CartSummary
  country: string
  handoverFromCart?: CartSummary | null
  locale: string
  queryClient: QueryClient
}) {
  queryClient.setQueryData(
    getCartQueryKey({ cartId: cart.id, country, locale }),
    cart,
  )

  const activeCartQueryKey = getCartQueryKey({ country, locale })
  const activeCart = queryClient.getQueryData<CartSummary | null>(
    activeCartQueryKey,
  )

  const canReplaceHandoverOwner =
    handoverFromCart !== undefined &&
    (handoverFromCart === null
      ? activeCart === null
      : activeCart?.id === handoverFromCart.id)

  // A response for an older cart must not take ownership of the shared
  // market query after the active cart identity has changed. An uninitialized
  // query can still be seeded, but a known empty or different cart is owned by
  // the current session and must be left untouched.
  if (
    activeCart === undefined ||
    activeCart?.id === cart.id ||
    canReplaceHandoverOwner
  ) {
    queryClient.setQueryData(activeCartQueryKey, cart)
  }
}
