// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import { confirmCheckoutPaymentProvider } from './payment-provider-confirmation'

const input = {
  clientSecret: 'pi_secret_123',
  confirmPaymentFallbackMessage: 'Unable to confirm payment.',
  paymentFormNotReadyMessage: 'Payment form is not ready.',
  returnUrl: 'https://shop.example.com/us/en/confirm-payment/cart_123',
  savedPaymentProfileId: null,
  stripeNotLoadedMessage: 'Stripe has not loaded yet.',
}

describe('payment provider confirmation', () => {
  it('returns success only after the provider confirms without an error', async () => {
    const confirmPayment = vi.fn().mockResolvedValue({})

    await expect(
      confirmCheckoutPaymentProvider({
        ...input,
        stripePaymentHandle: { confirmPayment },
      }),
    ).resolves.toEqual({ type: 'success' })
    expect(confirmPayment).toHaveBeenCalledWith(input.returnUrl)
  })

  it('returns a displayable provider error without marking payment successful', async () => {
    await expect(
      confirmCheckoutPaymentProvider({
        ...input,
        stripePaymentHandle: {
          confirmPayment: vi.fn().mockResolvedValue({
            displayError: true,
            error: 'Your card was declined.',
          }),
        },
      }),
    ).resolves.toEqual({
      displayError: true,
      message: 'Your card was declined.',
      type: 'error',
    })
  })

  it('uses safe local copy when the payment form is unavailable', async () => {
    await expect(
      confirmCheckoutPaymentProvider({
        ...input,
        stripePaymentHandle: null,
      }),
    ).resolves.toEqual({
      displayError: undefined,
      message: 'Payment form is not ready.',
      type: 'error',
    })
  })

  it('treats a thrown confirmation request as unknown rather than retryable failure', async () => {
    await expect(
      confirmCheckoutPaymentProvider({
        ...input,
        stripePaymentHandle: {
          confirmPayment: vi.fn().mockRejectedValue(new Error('Network lost')),
        },
      }),
    ).resolves.toEqual({ type: 'unknown' })
  })
})
