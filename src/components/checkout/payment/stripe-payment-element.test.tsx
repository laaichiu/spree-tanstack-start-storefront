import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { StripePaymentElement } from './stripe-payment-element'

const confirmPaymentMock = vi.hoisted(() => vi.fn())
const elementsSubmitMock = vi.hoisted(() => vi.fn())
const elementsFetchUpdatesMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/stripe/client', () => ({
  stripePromise: Promise.resolve({}),
}))

vi.mock('@stripe/react-stripe-js', async () => {
  const React = await import('react')

  return {
    Elements: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    PaymentElement: ({ onReady }: { onReady?: () => void }) => {
      React.useEffect(() => {
        onReady?.()
      }, [onReady])

      return React.createElement('div', {
        'data-testid': 'stripe-payment-element',
      })
    },
    useElements: () => ({
      fetchUpdates: elementsFetchUpdatesMock,
      submit: elementsSubmitMock,
    }),
    useStripe: () => ({
      confirmPayment: confirmPaymentMock,
    }),
  }
})

afterEach(() => {
  cleanup()
  confirmPaymentMock.mockReset()
  elementsSubmitMock.mockReset()
  elementsFetchUpdatesMock.mockReset()
})

describe('StripePaymentElement', () => {
  it('validates the Payment Element before confirming payment', async () => {
    elementsSubmitMock.mockResolvedValueOnce({
      error: {
        message: 'Your card number is incomplete.',
      },
    })
    const handleReady = vi.fn()

    render(
      <StripePaymentElement
        clientSecret="pi_test_secret"
        confirmPaymentFallbackMessage="Unable to confirm payment."
        onReady={handleReady}
        stripeNotLoadedMessage="Stripe has not loaded yet."
      />,
    )

    await waitFor(() => {
      expect(handleReady).toHaveBeenCalled()
    })

    const handle = handleReady.mock.lastCall?.[0] as StripePaymentElementHandle

    let result: Awaited<
      ReturnType<StripePaymentElementHandle['confirmPayment']>
    >

    await act(async () => {
      result = await handle.confirmPayment('https://example.com/return')
    })

    expect(result!).toEqual({
      displayError: false,
      error: 'Your card number is incomplete.',
    })

    expect(elementsSubmitMock).toHaveBeenCalledOnce()
    expect(confirmPaymentMock).not.toHaveBeenCalled()
    expect(screen.queryByText('Your card number is incomplete.')).toBe(null)
  })
})
