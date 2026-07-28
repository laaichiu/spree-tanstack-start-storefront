import { afterEach, describe, expect, it, vi } from 'vitest'

import { confirmStripeSavedCardPayment } from './stripe-payment-confirmation'

const confirmCardPaymentMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/stripe/client', () => ({
  stripePromise: Promise.resolve({
    confirmCardPayment: confirmCardPaymentMock,
  }),
}))

afterEach(() => {
  confirmCardPaymentMock.mockReset()
})

describe('confirmStripeSavedCardPayment', () => {
  it('confirms a saved card with the checkout return URL', async () => {
    confirmCardPaymentMock.mockResolvedValueOnce({})

    await expect(
      confirmStripeSavedCardPayment({
        clientSecret: 'pi_test_secret',
        confirmPaymentFallbackMessage: 'Unable to confirm payment.',
        paymentMethodId: 'pm_saved',
        returnUrl: 'https://example.com/return',
        stripeNotLoadedMessage: 'Stripe has not loaded yet.',
      }),
    ).resolves.toEqual({})

    expect(confirmCardPaymentMock).toHaveBeenCalledWith('pi_test_secret', {
      payment_method: 'pm_saved',
      return_url: 'https://example.com/return',
    })
  })

  it('maps Stripe saved-card errors to the checkout result', async () => {
    confirmCardPaymentMock.mockResolvedValueOnce({
      error: {
        message: 'Card declined',
      },
    })

    await expect(
      confirmStripeSavedCardPayment({
        clientSecret: 'pi_test_secret',
        confirmPaymentFallbackMessage: 'Unable to confirm payment.',
        paymentMethodId: 'pm_saved',
        returnUrl: 'https://example.com/return',
        stripeNotLoadedMessage: 'Stripe has not loaded yet.',
      }),
    ).resolves.toEqual({
      error: 'Card declined',
    })
  })
})
