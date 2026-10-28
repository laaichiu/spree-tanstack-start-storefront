import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductPurchaseActionView } from './product-purchase-action-view'

afterEach(cleanup)

const copy = {
  addToBag: 'Add to cart',
  addToBagFailed: 'Could not add to cart',
  addingToBag: 'Adding to cart',
  preorder: 'Pre-order',
  purchaseUnavailable: 'Unavailable',
  variantUnavailable: 'Select a variant',
}

describe('ProductPurchaseActionView', () => {
  it('submits ready and preorder purchases', () => {
    const addToCart = vi.fn()
    const { rerender } = render(
      <ProductPurchaseActionView
        copy={copy}
        model={{
          availability: 'ready',
          canAddToCart: true,
          hasAddToCartError: false,
          isAddingToCart: false,
          isPreorder: false,
        }}
        onAddToCart={addToCart}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(addToCart).toHaveBeenCalledOnce()

    rerender(
      <ProductPurchaseActionView
        copy={copy}
        model={{
          availability: 'ready',
          canAddToCart: true,
          hasAddToCartError: false,
          isAddingToCart: false,
          isPreorder: true,
        }}
        onAddToCart={addToCart}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Pre-order' }))
    expect(addToCart).toHaveBeenCalledTimes(2)
  })

  it('blocks pending and unavailable purchases with specific feedback', () => {
    const addToCart = vi.fn()
    const { rerender } = render(
      <ProductPurchaseActionView
        copy={copy}
        model={{
          availability: 'select_variant',
          canAddToCart: false,
          hasAddToCartError: false,
          isAddingToCart: false,
          isPreorder: false,
        }}
        onAddToCart={addToCart}
      />,
    )

    expect(screen.getByRole('button', { name: 'Unavailable' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByText('Select a variant')).toBeTruthy()

    rerender(
      <ProductPurchaseActionView
        copy={copy}
        model={{
          availability: 'ready',
          canAddToCart: true,
          hasAddToCartError: false,
          isAddingToCart: true,
          isPreorder: false,
        }}
        onAddToCart={addToCart}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Adding to cart' }))
    expect(addToCart).not.toHaveBeenCalled()
  })

  it('shows add-to-cart failures without disabling a retry', () => {
    render(
      <ProductPurchaseActionView
        copy={copy}
        model={{
          availability: 'ready',
          canAddToCart: true,
          hasAddToCartError: true,
          isAddingToCart: false,
          isPreorder: false,
        }}
        onAddToCart={vi.fn()}
      />,
    )

    expect(screen.getByText('Could not add to cart')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add to cart' })).toHaveProperty(
      'disabled',
      false,
    )
  })
})
