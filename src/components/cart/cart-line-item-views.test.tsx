import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CartDrawerLineItemView } from './cart-drawer-line-item-view'
import { CartLineItemView } from './cart-line-item-view'

afterEach(cleanup)

const renderProductLink = (content: ReactNode, className?: string) => (
  <a className={className} href="/products/example">
    {content}
  </a>
)

describe('Cart line item views', () => {
  it('delegates page line-item removal directly', () => {
    const onRemoveItem = vi.fn()

    render(
      <CartLineItemView
        model={{
          displayOptions: [],
          imageFallbackLabel: 'Image unavailable',
          isPending: false,
          labels: {
            remove: 'Remove',
            removeItem: 'Remove item',
            total: 'Total',
          },
          name: 'Example product',
          totalPrice: { compareAtPriceLabel: null, priceLabel: '$20.00' },
          unitPrice: { compareAtPriceLabel: null, priceLabel: '$20.00' },
        }}
        onRemoveItem={onRemoveItem}
        renderProductLink={renderProductLink}
        quantitySelector={<span>Quantity</span>}
      />,
    )

    expect(screen.getByText('Quantity')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))

    expect(onRemoveItem).toHaveBeenCalledTimes(1)
  })

  it('delegates drawer line-item removal directly', () => {
    const onRemoveItem = vi.fn()

    render(
      <CartDrawerLineItemView
        model={{
          displayOptions: [],
          imageFallbackLabel: 'Image unavailable',
          isPending: false,
          labels: {
            remove: 'Remove',
            removeItem: 'Remove item',
          },
          name: 'Example product',
          totalPrice: { compareAtPriceLabel: null, priceLabel: '$20.00' },
        }}
        onRemoveItem={onRemoveItem}
        renderProductLink={renderProductLink}
        quantitySelector={<span>Quantity</span>}
      />,
    )

    expect(screen.getByText('Quantity')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))

    expect(onRemoveItem).toHaveBeenCalledTimes(1)
  })
})
