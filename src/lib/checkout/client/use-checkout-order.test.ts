// @vitest-environment node

import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { getCartQueryKey } from '@/lib/cart/client/cart-query'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'

import {
  getCheckoutOrderQueryKey,
  getCheckoutOrderSnapshotQueryKey,
  syncCheckoutOrderQueryData,
} from './use-checkout-order'

const identity = {
  cartId: 'cart_123',
  country: 'us',
  locale: 'en',
}

describe('checkout order query ownership', () => {
  it('isolates checkout entry snapshots from shared cart and checkout caches', () => {
    const snapshotKey = getCheckoutOrderSnapshotQueryKey(identity)

    expect(snapshotKey).not.toEqual(getCartQueryKey(identity))
    expect(snapshotKey).not.toEqual(getCheckoutOrderQueryKey(identity))
  })

  it('does not let an older checkout response replace another active cart', () => {
    const queryClient = new QueryClient()
    const activeCart = mapSpreeCheckoutToOrder(
      {
        ...baseCart,
        id: 'cart-current',
      },
      { locale: 'en' },
    )
    const olderCheckoutOrder = mapSpreeCheckoutToOrder(
      {
        ...baseCart,
        id: 'cart-older',
      },
      { locale: 'en' },
    )
    const activeCartKey = getCartQueryKey({
      country: identity.country,
      locale: identity.locale,
    })

    queryClient.setQueryData(activeCartKey, activeCart)

    syncCheckoutOrderQueryData({
      country: identity.country,
      locale: identity.locale,
      order: olderCheckoutOrder,
      queryClient,
    })

    expect(queryClient.getQueryData(activeCartKey)).toEqual(activeCart)
    expect(
      queryClient.getQueryData(
        getCheckoutOrderQueryKey({
          cartId: olderCheckoutOrder.id,
          country: identity.country,
          locale: identity.locale,
        }),
      ),
    ).toEqual(olderCheckoutOrder)
  })
})
