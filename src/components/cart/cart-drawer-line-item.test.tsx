import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CartLineItem } from '@/lib/cart/model/cart'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CartDrawerLineItem } from './cart-drawer-line-item'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => (
    <a href="/fixture-link">{children}</a>
  ),
}))

const saleItem = {
  compareAtTotalPrice: { amount: 48, currencyCode: 'USD' },
  id: 'line-item-sale',
  imageUrl: null,
  name: 'Forever Jersey Cropped Tee',
  optionValues: [],
  optionsText: 'Size: S, Color: Burnished Lilac',
  productSlug: 'forever-jersey-cropped-tee',
  quantity: 1,
  totalPrice: { amount: 21.75, currencyCode: 'USD' },
  unitPrice: { amount: 29, currencyCode: 'USD' },
  variantId: 'variant-sale',
} satisfies CartLineItem

afterEach(cleanup)

describe('CartDrawerLineItem', () => {
  it('shows the current price and compare-at total without inventing a promotion percentage', () => {
    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <CartDrawerLineItem
          item={saleItem}
          marketParams={{ country: 'us', locale: 'en' }}
          onClose={vi.fn()}
          onRemoveItem={vi.fn(async () => undefined)}
          onUpdateQuantity={vi.fn(async () => undefined)}
          pending={false}
        />
      </MarketProvider>,
    )

    expect(screen.getByText('$21.75')).toBeTruthy()
    expect(screen.getByText('$48.00').className).toContain('line-through')
  })
})
