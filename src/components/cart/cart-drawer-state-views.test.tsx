import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CartDrawerBodyView } from './cart-drawer-body-view'

afterEach(cleanup)

const renderShopLink = (content: ReactNode, className?: string) => (
  <a className={className} href="/products">
    {content}
  </a>
)

describe('CartDrawerBodyView', () => {
  it('presents loading, ready, recovery and empty states', () => {
    const recover = vi.fn()
    const { rerender } = render(
      <CartDrawerBodyView
        model={{ loadingLabel: 'Loading your cart…', status: 'loading' }}
        onRecover={recover}
        renderShopLink={renderShopLink}
        items={<p>Cart item</p>}
      />,
    )

    expect(screen.getByText('Loading your cart…')).toBeTruthy()

    rerender(
      <CartDrawerBodyView
        model={{ mutationError: 'Could not update cart.', status: 'ready' }}
        onRecover={recover}
        renderShopLink={renderShopLink}
        items={<p>Cart item</p>}
      />,
    )
    expect(screen.getByText('Cart item')).toBeTruthy()
    expect(screen.getByText('Could not update cart.')).toBeTruthy()

    rerender(
      <CartDrawerBodyView
        model={{
          error: {
            actionLabel: 'Reset cart',
            description: 'Your cart could not be loaded.',
            error: 'The cart session could not be reset.',
            isPending: false,
            pendingActionLabel: 'Resetting cart',
            title: 'Cart load failed',
          },
          status: 'error',
        }}
        onRecover={recover}
        renderShopLink={renderShopLink}
        items={null}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reset cart' }))
    expect(recover).toHaveBeenCalledOnce()
    expect(
      screen.getByText('The cart session could not be reset.'),
    ).toBeTruthy()

    rerender(
      <CartDrawerBodyView
        model={{
          empty: {
            actionLabel: 'Start shopping',
            description: 'Add something special to your bag.',
            title: 'Your bag is empty',
          },
          status: 'empty',
        }}
        onRecover={recover}
        renderShopLink={renderShopLink}
        items={null}
      />,
    )
    expect(screen.getByRole('link', { name: 'Start shopping' })).toHaveProperty(
      'pathname',
      '/products',
    )
  })

  it('disables recovery while reset is pending', () => {
    render(
      <CartDrawerBodyView
        model={{
          error: {
            actionLabel: 'Reset cart',
            description: 'Your cart could not be loaded.',
            error: null,
            isPending: true,
            pendingActionLabel: 'Resetting cart',
            title: 'Cart load failed',
          },
          status: 'error',
        }}
        onRecover={vi.fn()}
        renderShopLink={renderShopLink}
        items={null}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Resetting cart' }),
    ).toHaveProperty('disabled', true)
  })
})
