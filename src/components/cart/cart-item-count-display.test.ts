import { describe, expect, it } from 'vitest'

import { getCartItemCountLabel } from './cart-item-count-display'

describe('getCartItemCountLabel', () => {
  it.each([
    { count: 0, expected: '0 items' },
    { count: 1, expected: '1 item' },
    { count: 2, expected: '2 items' },
  ])('formats count $count as "$expected"', ({ count, expected }) => {
    expect(
      getCartItemCountLabel({
        itemCount: count,
        itemPlural: 'items',
        itemSingular: 'item',
      }),
    ).toBe(expected)
  })
})
