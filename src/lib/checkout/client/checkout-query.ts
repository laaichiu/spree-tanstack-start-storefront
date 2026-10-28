import type { QueryClient } from '@tanstack/react-query'

import { getCartQueryKey } from '../../cart/client/cart-query'

export const checkoutOrderQueryKey = ['checkout'] as const
export const checkoutOrderSnapshotQueryKey = [
  'checkout-order-snapshot',
] as const

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

export function getCheckoutOrderSnapshotQueryKey({
  cartId,
  country,
  locale,
}: {
  cartId: string
  country: string
  locale: string
}) {
  return [...checkoutOrderSnapshotQueryKey, country, locale, cartId] as const
}

export async function cancelCheckoutOrderQueries({
  cartId,
  country,
  locale,
  queryClient,
}: {
  cartId?: string
  country: string
  locale: string
  queryClient: QueryClient
}) {
  await Promise.all([
    queryClient.cancelQueries({
      queryKey: getCheckoutOrderQueryKey({ cartId, country, locale }),
    }),
    queryClient.cancelQueries({
      queryKey: getCartQueryKey({ country, locale }),
    }),
  ])
}
