import { describe, expect, it } from 'vitest'

import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'

import {
  getCheckoutPaymentSessionExternalData,
  getCheckoutPaymentSessionKey,
  getCheckoutPaymentReturnUrl,
  getCheckoutSavedStripePaymentMethodId,
  isFailedPaymentSessionStatus,
  readSafePaymentSessionErrorMessage,
  readStripeClientSecret,
  redactPaymentProviderSecrets,
} from './payment-session'

const stripePaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
} satisfies CheckoutPaymentMethod

const directPaymentMethod = {
  description: null,
  gatewayId: 'unknown',
  id: 'pm-check',
  name: 'Check',
  sessionRequired: false,
  type: 'Spree::PaymentMethod::Check',
} satisfies CheckoutPaymentMethod

const adyenPaymentMethod = {
  description: null,
  gatewayId: 'adyen',
  id: 'pm-adyen',
  name: 'Adyen',
  sessionRequired: true,
  type: 'SpreeAdyen::Gateway',
} satisfies CheckoutPaymentMethod

function checkoutOrder(overrides: Partial<CheckoutOrder> = {}): CheckoutOrder {
  return {
    amountDue: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: ['cart', 'address', 'delivery'],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    discountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    email: 'customer@example.com',
    id: 'cart-1',
    itemCount: 1,
    itemTotal: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    items: [],
    paymentMethods: [stripePaymentMethod],
    requirements: [],
    shippingAddress: null,
    shippingMatchesBillingAddress: true,
    shippingRates: [
      {
        deliveryMethodId: 'delivery-method-1',
        fulfillmentId: 'fulfillment-1',
        id: 'rate-1',
        name: 'Ground',
        displayPrice: {
          amount: 0,
          currencyCode: 'USD',
        },
        price: {
          amount: 0,
          currencyCode: 'USD',
        },
        selected: true,
      },
    ],
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 49.99,
      currencyCode: 'USD',
    },
    ...overrides,
  }
}

describe('checkout payment session helpers', () => {
  it('reads Stripe client secrets from supported provider field names', () => {
    expect(
      readStripeClientSecret({
        client_secret: 'pi_secret_snake',
      }),
    ).toBe('pi_secret_snake')
    expect(
      readStripeClientSecret({
        clientSecret: 'pi_secret_camel',
      }),
    ).toBe('pi_secret_camel')
    expect(
      readStripeClientSecret({
        payment_intent_client_secret: 'pi_secret_intent',
      }),
    ).toBe('pi_secret_intent')
    expect(
      readStripeClientSecret({
        client_secret: '   ',
      }),
    ).toBeUndefined()
  })

  it('builds the provider return URL for checkout confirmation', () => {
    expect(
      getCheckoutPaymentReturnUrl({
        cartId: 'cart_123',
        country: 'us',
        locale: 'en',
        sessionId: 'ps_123',
      }),
    ).toBe(
      `${window.location.origin}/us/en/confirm-payment/cart_123?session=ps_123`,
    )
  })

  it('keys payment sessions by provider method, selected shipping, and payable amount', () => {
    expect(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder(),
        paymentMethod: stripePaymentMethod,
      }),
    ).toBe(
      'cart-1:pm-stripe:stripe:session:USD:fulfillment-1:rate-1:49.99:0:0:49.99:49.99:',
    )

    expect(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder({
          amountDue: {
            amount: 19.99,
            currencyCode: 'USD',
          },
        }),
        paymentMethod: stripePaymentMethod,
      }),
    ).not.toBe(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder(),
        paymentMethod: stripePaymentMethod,
      }),
    )

    expect(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder({
          shippingRates: [
            {
              deliveryMethodId: 'delivery-method-2',
              fulfillmentId: 'fulfillment-2',
              id: 'rate-2',
              name: 'Express',
              displayPrice: {
                amount: 12,
                currencyCode: 'USD',
              },
              price: {
                amount: 12,
                currencyCode: 'USD',
              },
              selected: true,
            },
          ],
        }),
        paymentMethod: stripePaymentMethod,
      }),
    ).not.toBe(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder(),
        paymentMethod: stripePaymentMethod,
      }),
    )

    expect(
      getCheckoutPaymentSessionKey({
        order: checkoutOrder(),
        paymentMethod: stripePaymentMethod,
        savedPaymentMethodId: 'pm_saved',
      }),
    ).toBe(
      'cart-1:pm-stripe:stripe:session:USD:fulfillment-1:rate-1:49.99:0:0:49.99:49.99:pm_saved',
    )
  })

  it('resolves saved Stripe payment methods only for Stripe session payments', () => {
    const savedPaymentCards = [
      {
        brand: 'visa',
        default: true,
        expiryMonth: 4,
        expiryYear: 2030,
        gatewayPaymentProfileId: 'pm_saved',
        id: 'card_1',
        last4: '4242',
        name: null,
      },
    ]

    expect(
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod: stripePaymentMethod,
        savedPaymentCards,
        selectedPaymentProfileId: 'pm_saved',
      }),
    ).toBe('pm_saved')
    expect(
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod: stripePaymentMethod,
        savedPaymentCards,
        selectedPaymentProfileId: 'pm_missing',
      }),
    ).toBeNull()
    expect(
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod: adyenPaymentMethod,
        savedPaymentCards,
        selectedPaymentProfileId: 'pm_saved',
      }),
    ).toBeNull()
    expect(
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod: directPaymentMethod,
        savedPaymentCards,
        selectedPaymentProfileId: 'pm_saved',
      }),
    ).toBeNull()
  })

  it('builds payment session external data with optional saved Stripe payment method id', () => {
    expect(
      getCheckoutPaymentSessionExternalData({
        savedStripePaymentMethodId: 'pm_saved',
      }),
    ).toEqual({
      stripe_payment_method_id: 'pm_saved',
    })

    expect(
      getCheckoutPaymentSessionExternalData({
        savedStripePaymentMethodId: '   ',
      }),
    ).toEqual({})
  })

  it('recognizes failed or canceled payment session statuses', () => {
    expect(isFailedPaymentSessionStatus('failed')).toBe(true)
    expect(isFailedPaymentSessionStatus('failure')).toBe(true)
    expect(isFailedPaymentSessionStatus('canceled')).toBe(true)
    expect(isFailedPaymentSessionStatus('cancelled')).toBe(true)
    expect(isFailedPaymentSessionStatus('completed')).toBe(false)
    expect(isFailedPaymentSessionStatus('processing')).toBe(false)
  })

  it('redacts Stripe keys from provider messages', () => {
    expect(
      redactPaymentProviderSecrets(
        'Expired API Key provided: sk_test_123456789abcdef',
      ),
    ).toBe('Expired API Key provided: sk_test_[redacted]')

    expect(
      redactPaymentProviderSecrets(
        'Use pk_live_abc123456789 and sk_live_987654321abc',
      ),
    ).toBe('Use pk_live_[redacted] and sk_live_[redacted]')
  })

  it('uses a safe fallback for payment provider configuration errors', () => {
    expect(
      readSafePaymentSessionErrorMessage(
        new Error('Expired API Key provided: sk_test_123456789abcdef'),
        'Payment session could not be initialized.',
      ),
    ).toBe('Payment session could not be initialized.')

    expect(
      readSafePaymentSessionErrorMessage(
        {
          message: 'Request failed',
          raw: {
            code: 'api_key_expired',
            message: 'Expired API Key provided: sk_test_123456789abcdef',
          },
        },
        'Payment session could not be initialized.',
      ),
    ).toBe('Payment session could not be initialized.')
  })

  it('keeps non-configuration provider errors while redacting secrets', () => {
    expect(
      readSafePaymentSessionErrorMessage(
        new Error('Payment declined for sk_test_123456789abcdef'),
        'Payment failed.',
      ),
    ).toBe('Payment declined for sk_test_[redacted]')
  })

  it('uses a safe fallback for provider errors containing internal object IDs', () => {
    expect(
      readSafePaymentSessionErrorMessage(
        new Error(
          'The PaymentMethod pm_saved does not belong to Customer cus_current.',
        ),
        'Payment session could not be initialized.',
      ),
    ).toBe('Payment session could not be initialized.')
  })
})
