// @vitest-environment node

import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import { baseCart } from '../mappers/cart.mapper.fixture'
import { getCartQueryKey, syncCartQueryData } from './cart-query'

const market = {
  country: 'us',
  locale: 'en',
}

describe('cart query synchronization', () => {
  it('seeds the active market query when no cart identity is known', () => {
    const queryClient = new QueryClient()
    const cart = mapSpreeCartToSummary(baseCart)

    syncCartQueryData({
      cart,
      ...market,
      queryClient,
    })

    expect(queryClient.getQueryData(getCartQueryKey(market))).toEqual(cart)
    expect(
      queryClient.getQueryData(getCartQueryKey({ ...market, cartId: cart.id })),
    ).toEqual(cart)
  })

  it('keeps a known empty active cart when an older cart response arrives', () => {
    const queryClient = new QueryClient()
    const activeCartKey = getCartQueryKey(market)
    const olderCart = mapSpreeCartToSummary({ ...baseCart, id: 'cart-older' })

    queryClient.setQueryData(activeCartKey, null)

    syncCartQueryData({
      cart: olderCart,
      ...market,
      queryClient,
    })

    expect(queryClient.getQueryData(activeCartKey)).toBeNull()
    expect(
      queryClient.getQueryData(
        getCartQueryKey({ ...market, cartId: olderCart.id }),
      ),
    ).toEqual(olderCart)
  })
})
