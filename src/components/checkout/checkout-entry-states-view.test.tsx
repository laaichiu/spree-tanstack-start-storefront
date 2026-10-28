import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CheckoutLoadErrorStateView,
  CheckoutLoadingStateView,
  CheckoutUnavailableStateView,
} from './checkout-entry-states-view'

afterEach(cleanup)

describe('checkout entry states', () => {
  it('presents loading and unavailable checkout states', () => {
    const { rerender } = render(
      <CheckoutLoadingStateView model={{ message: 'Loading checkout…' }} />,
    )
    expect(screen.getByText('Loading checkout…')).toBeTruthy()

    rerender(
      <CheckoutUnavailableStateView
        capabilities={{
          renderProductsLink: (content, className) => (
            <a className={className} href="/us/en/products">
              {content}
            </a>
          ),
        }}
        model={{
          description: 'Your cart is empty.',
          eyebrow: 'Checkout',
          shopAllProductsLabel: 'Shop all products',
          title: 'Checkout unavailable',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Checkout unavailable' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Shop all products' }),
    ).toHaveProperty('pathname', '/us/en/products')
  })

  it('recovers a failed checkout session', () => {
    const reset = vi.fn()
    render(
      <CheckoutLoadErrorStateView
        model={{
          errorMessage: 'Please try again.',
          errorTitle: 'Checkout could not be loaded.',
          isResetPending: false,
          resetLabel: 'Reset cart',
          resettingLabel: 'Resetting…',
        }}
        onReset={reset}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reset cart' }))
    expect(reset).toHaveBeenCalledOnce()
    expect(screen.getByText('Please try again.')).toBeTruthy()
  })

  it('blocks duplicate recovery while reset is pending', () => {
    const reset = vi.fn()
    render(
      <CheckoutLoadErrorStateView
        model={{
          errorMessage: 'Please try again.',
          errorTitle: 'Checkout could not be loaded.',
          isResetPending: true,
          resetLabel: 'Reset cart',
          resettingLabel: 'Resetting…',
        }}
        onReset={reset}
      />,
    )

    const button = screen.getByRole('button', { name: 'Resetting…' })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(reset).not.toHaveBeenCalled()
  })
})
