import { describe, expect, it } from 'vitest'

import type { CartSummary } from '@/lib/cart/model/cart'

import {
  cartLineItemsChanged,
  getCartItemsFingerprint,
} from './cart-items-fingerprint'

function cartWithItems(
  items: Array<Pick<CartSummary['items'][number], 'id' | 'quantity'>>,
): Pick<CartSummary, 'items'> {
  return {
    items: items.map((item) => ({
      id: item.id,
      imageUrl: null,
      name: item.id,
      optionValues: [],
      optionsText: '',
      productSlug: item.id,
      quantity: item.quantity,
      totalPrice: { amount: 0, currencyCode: 'USD' },
      unitPrice: { amount: 0, currencyCode: 'USD' },
      variantId: item.id,
    })),
  }
}

describe('cart items fingerprint', () => {
  it('tracks line item ids and quantities only', () => {
    expect(
      getCartItemsFingerprint(
        cartWithItems([
          { id: 'line_1', quantity: 1 },
          { id: 'line_2', quantity: 3 },
        ]),
      ),
    ).toBe('line_1:1|line_2:3')
  })

  it('detects line item changes without comparing totals or checkout fields', () => {
    const previous = cartWithItems([{ id: 'line_1', quantity: 1 }])
    const sameLineItems = cartWithItems([{ id: 'line_1', quantity: 1 }])
    const changedQuantity = cartWithItems([{ id: 'line_1', quantity: 2 }])
    const changedItems = cartWithItems([
      { id: 'line_1', quantity: 1 },
      { id: 'line_2', quantity: 1 },
    ])

    expect(cartLineItemsChanged(previous, sameLineItems)).toBe(false)
    expect(cartLineItemsChanged(previous, changedQuantity)).toBe(true)
    expect(cartLineItemsChanged(previous, changedItems)).toBe(true)
  })
})
