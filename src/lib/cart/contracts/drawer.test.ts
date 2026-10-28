import { describe, expect, it } from 'vitest'

import type { CartSummary } from './cart'
import { getCartDrawerModel } from './drawer'

const readyCart: CartSummary = {
  appliedDiscounts: [],
  appliedGiftCard: null,
  completedSteps: [],
  currencyCode: 'USD',
  currentStep: null,
  deliveryTotal: null,
  discountTotal: null,
  id: 'cart_1',
  itemCount: 1,
  items: [
    {
      compareAtTotalPrice: null,
      id: 'line_item_1',
      imageUrl: null,
      name: 'Product',
      optionValues: [],
      optionsText: '',
      productSlug: 'product',
      quantity: 1,
      totalPrice: { amount: 10, currencyCode: 'USD' },
      unitPrice: { amount: 10, currencyCode: 'USD' },
      variantId: 'variant_1',
    },
  ],
  itemTotal: { amount: 10, currencyCode: 'USD' },
  shippingDiscountTotal: null,
  shippingRates: [],
  taxTotal: null,
  total: { amount: 10, currencyCode: 'USD' },
}

describe('getCartDrawerModel', () => {
  it('prioritizes a load error over the empty state', () => {
    expect(
      getCartDrawerModel({
        cart: null,
        freeShippingPromotion: null,
        hasLoadError: true,
        isLoading: false,
      }),
    ).toEqual({ reason: 'load_failed', status: 'error' })
  })

  it('keeps a successfully loaded cart without items empty', () => {
    expect(
      getCartDrawerModel({
        cart: { ...readyCart, itemCount: 0, items: [] },
        freeShippingPromotion: null,
        hasLoadError: false,
        isLoading: false,
      }),
    ).toEqual({ status: 'empty' })
  })

  it('projects a loaded cart into the ready state', () => {
    expect(
      getCartDrawerModel({
        cart: readyCart,
        freeShippingPromotion: null,
        hasLoadError: false,
        isLoading: false,
      }),
    ).toMatchObject({ cart: readyCart, status: 'ready' })
  })
})
