import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutPaymentMethodErrorView } from './checkout-payment-method-error-view'

afterEach(cleanup)

describe('CheckoutPaymentMethodErrorView', () => {
  it('forwards a retry from a retryable error', () => {
    const retry = vi.fn()

    render(
      <CheckoutPaymentMethodErrorView
        model={{
          error: 'Payment form failed to load',
          isRetryable: true,
          retryDisabled: false,
          retryLabel: 'Retry payment form',
        }}
        onRetry={retry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry payment form' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('blocks a retry while the payment error is disabled', () => {
    const retry = vi.fn()

    render(
      <CheckoutPaymentMethodErrorView
        model={{
          error: 'Payment setup is unavailable',
          isRetryable: true,
          retryDisabled: true,
          retryLabel: 'Retry payment setup',
        }}
        onRetry={retry}
      />,
    )

    const button = screen.getByRole('button', { name: 'Retry payment setup' })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(retry).not.toHaveBeenCalled()
  })

  it('does not render without an error', () => {
    const retry = vi.fn()

    render(
      <CheckoutPaymentMethodErrorView
        model={{
          error: null,
          isRetryable: true,
          retryDisabled: false,
          retryLabel: 'Retry payment setup',
        }}
        onRetry={retry}
      />,
    )

    expect(screen.queryByRole('button')).toBeNull()
  })
})
