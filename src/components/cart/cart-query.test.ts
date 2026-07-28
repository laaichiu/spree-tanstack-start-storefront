import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { CartSummary } from '@/lib/cart/model/cart'

import { getCartQueryKey, syncCartQueryData } from './cart-query'

function cart(id: string, itemCount: number): CartSummary {
  const money = { amount: 0, currencyCode: 'USD' }

  return {
    appliedDiscounts: [],
    appliedGiftCard: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'cart',
    deliveryTotal: money,
    discountTotal: money,
    id,
    itemCount,
    items: [],
    itemTotal: money,
    shippingDiscountTotal: money,
    shippingRates: [],
    taxTotal: money,
    total: money,
  }
}

describe('cart query identity', () => {
  it('includes market and optional cart identity', () => {
    expect(getCartQueryKey({ country: 'us', locale: 'en' })).toEqual([
      'cart',
      'us',
      'en',
    ])
    expect(
      getCartQueryKey({ cartId: 'cart-1', country: 'us', locale: 'en' }),
    ).toEqual(['cart', 'us', 'en', 'cart-1'])
  })

  it('synchronizes only the active market and returned cart identities', () => {
    const queryClient = new QueryClient()
    const previousCart = cart('cart-1', 1)
    const updatedCart = cart('cart-1', 2)
    const otherMarketCart = cart('cart-ca', 3)
    const usKey = getCartQueryKey({ country: 'us', locale: 'en' })
    const usCartKey = getCartQueryKey({
      cartId: 'cart-1',
      country: 'us',
      locale: 'en',
    })
    const caKey = getCartQueryKey({ country: 'ca', locale: 'en' })

    queryClient.setQueryData(usKey, previousCart)
    queryClient.setQueryData(usCartKey, previousCart)
    queryClient.setQueryData(caKey, otherMarketCart)

    syncCartQueryData({
      cart: updatedCart,
      country: 'us',
      locale: 'en',
      queryClient,
    })

    expect(queryClient.getQueryData(usKey)).toEqual(updatedCart)
    expect(queryClient.getQueryData(usCartKey)).toEqual(updatedCart)
    expect(queryClient.getQueryData(caKey)).toEqual(otherMarketCart)
  })
})
