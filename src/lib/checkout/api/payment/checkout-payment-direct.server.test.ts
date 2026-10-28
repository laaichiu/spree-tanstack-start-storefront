// @vitest-environment node

import type { Client } from '@spree/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PaymentResourceTypeMismatchError } from '@/lib/checkout/utils/payment/payment-identity'

import { createDirectCheckoutPaymentOnServer } from './checkout-payment-direct.server'

const server = vi.hoisted(() => ({
  createPayment: vi.fn(),
  getCheckoutCartRequestOptions: vi.fn(),
  getServerSpreeClientForMarket: vi.fn(),
  requireCheckoutPaymentMethod: vi.fn(),
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: server.getCheckoutCartRequestOptions,
}))

vi.mock('./checkout-payment-validation.server', () => ({
  requireCheckoutPaymentMethod: server.requireCheckoutPaymentMethod,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const client = {
  carts: {
    payments: {
      create: server.createPayment,
    },
  },
} as unknown as Client

beforeEach(() => {
  vi.clearAllMocks()
  server.getCheckoutCartRequestOptions.mockImplementation(
    (cartToken?: string) => (cartToken ? { spreeToken: cartToken } : {}),
  )
  server.getServerSpreeClientForMarket.mockReturnValue(client)
  server.requireCheckoutPaymentMethod.mockResolvedValue({
    cartToken: 'rotated-cart-token',
  })
  server.createPayment.mockResolvedValue({
    id: 'pay_123',
    payment_method_id: 'pm_check',
  })
})

describe('direct checkout payment server boundary', () => {
  it('validates the created payment before reporting success', async () => {
    await expect(
      createDirectCheckoutPaymentOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_check',
        selectedShippingRate: undefined,
      }),
    ).resolves.toEqual({ success: true })

    expect(server.createPayment).toHaveBeenCalledWith(
      'cart_123',
      { payment_method_id: 'pm_check' },
      { spreeToken: 'rotated-cart-token' },
    )
  })

  it('fails closed when Spree returns a non-payment resource', async () => {
    server.createPayment.mockResolvedValueOnce({ id: 'or_123' })

    await expect(
      createDirectCheckoutPaymentOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_check',
        selectedShippingRate: undefined,
      }),
    ).rejects.toBeInstanceOf(PaymentResourceTypeMismatchError)
  })

  it('fails closed when the created payment uses another method', async () => {
    server.createPayment.mockResolvedValueOnce({
      id: 'pay_123',
      payment_method_id: 'pm_other',
    })

    await expect(
      createDirectCheckoutPaymentOnServer({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        market,
        paymentMethodId: 'pm_check',
        selectedShippingRate: undefined,
      }),
    ).rejects.toThrow(
      'The payment response does not match the requested payment method.',
    )
  })
})
