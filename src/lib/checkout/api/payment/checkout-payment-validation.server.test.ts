// @vitest-environment node

import type { Client } from '@spree/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CustomerCreditCardResourceTypeMismatchError } from '@/lib/account/utils/credit-card-identity'

import { getCheckoutPaymentRequestOptions } from './checkout-payment-validation.server'

const server = vi.hoisted(() => ({
  associateCart: vi.fn(),
  listCreditCards: vi.fn(),
  withCustomerSession: vi.fn(),
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: vi.fn(() => ({ spreeToken: 'cart-token' })),
  requireCheckoutCustomerCartAssociation: server.associateCart,
}))

vi.mock('@/lib/account/api/customer-session.server', () => ({
  withCustomerSession: server.withCustomerSession,
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

const client = {
  customer: {
    creditCards: {
      list: server.listCreditCards,
    },
  },
} as unknown as Client

beforeEach(() => {
  vi.clearAllMocks()
  server.associateCart.mockResolvedValue({ token: 'customer-token' })
  server.withCustomerSession.mockImplementation(
    async (
      action: (context: { client: Client; token: string }) => unknown,
      options?: { client?: Client },
    ) =>
      action({
        client: options?.client ?? client,
        token: 'customer-token',
      }),
  )
  server.listCreditCards.mockResolvedValue({
    data: [
      {
        brand: 'Visa',
        default: false,
        gateway_payment_profile_id: 'profile_123',
        id: 'card_123',
        last4: '4242',
        month: 12,
        name: null,
        year: 2030,
      },
    ],
  })
})

describe('saved payment method validation', () => {
  it('checks only verified customer credit-card resources', async () => {
    await expect(
      getCheckoutPaymentRequestOptions({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
        market,
        paymentData: { stripePaymentMethodId: 'profile_123' },
      }),
    ).resolves.toEqual({ token: 'customer-token' })

    expect(server.listCreditCards).toHaveBeenCalledWith(undefined, {
      token: 'customer-token',
    })
  })

  it('fails closed when the customer card list contains a mixed resource', async () => {
    server.listCreditCards.mockResolvedValueOnce({
      data: [
        {
          brand: 'Visa',
          default: false,
          gateway_payment_profile_id: 'profile_123',
          id: 'or_123',
          last4: '4242',
          month: 12,
          name: null,
          year: 2030,
        },
      ],
    })

    await expect(
      getCheckoutPaymentRequestOptions({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
        market,
        paymentData: { stripePaymentMethodId: 'profile_123' },
      }),
    ).rejects.toBeInstanceOf(CustomerCreditCardResourceTypeMismatchError)
  })

  it('fails closed when the customer card list envelope is malformed', async () => {
    server.listCreditCards.mockResolvedValueOnce(null)

    await expect(
      getCheckoutPaymentRequestOptions({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
        market,
        paymentData: { stripePaymentMethodId: 'profile_123' },
      }),
    ).rejects.toThrow('customer list response is malformed')
  })

  it('uses a refreshed customer token for cart association and card ownership', async () => {
    server.associateCart.mockImplementationOnce(
      ({ customerToken }: { customerToken?: string }) => ({
        token: customerToken,
      }),
    )
    server.withCustomerSession.mockImplementationOnce(
      async (
        action: (context: { client: Client; token: string }) => unknown,
        options?: { client?: Client },
      ) =>
        action({
          client: options?.client ?? client,
          token: 'refreshed-customer-token',
        }),
    )

    await getCheckoutPaymentRequestOptions({
      cartId: 'cart_123',
      cartToken: 'cart-token',
      client,
      market,
      paymentData: { stripePaymentMethodId: 'profile_123' },
    })

    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
    expect(server.associateCart).toHaveBeenCalledWith(
      expect.objectContaining({
        customerToken: 'refreshed-customer-token',
      }),
    )
    expect(server.listCreditCards).toHaveBeenCalledWith(undefined, {
      token: 'refreshed-customer-token',
    })
  })

  it('maps a missing customer session to the saved-payment fallback error', async () => {
    server.withCustomerSession.mockRejectedValueOnce({
      code: 'customer_session_required',
    })

    await expect(
      getCheckoutPaymentRequestOptions({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        client,
        market,
        paymentData: { stripePaymentMethodId: 'profile_123' },
      }),
    ).rejects.toThrow('Sign in again to use a saved payment method')
  })
})
