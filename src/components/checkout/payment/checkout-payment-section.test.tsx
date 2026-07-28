import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutPaymentSection } from './checkout-payment-section'

const paymentSessionHookState = vi.hoisted(() => ({
  isCreatingPaymentSession: false,
}))
const paymentSubmitHookState = vi.hoisted(() => ({
  isSubmittingPayment: false,
}))

vi.mock('@/lib/stripe/client', () => ({
  isStripeConfigured: true,
}))

vi.mock('./use-checkout-payment-selection', () => ({
  useCheckoutPaymentSelection: () => ({
    handlePaymentMethodChange: vi.fn(),
    handleSavedPaymentProfileChange: vi.fn(),
    savedStripePaymentCards: [],
    selectedPaymentMethod: {
      description: null,
      gatewayId: 'stripe',
      id: 'pm-stripe',
      name: 'Stripe',
      sessionRequired: true,
      type: 'SpreeStripe::Gateway',
    },
    selectedSavedPaymentProfileIdForSession: null,
  }),
}))

vi.mock('./use-checkout-payment-session', () => ({
  useCheckoutPaymentSession: () => ({
    clientSecret: undefined,
    isCreatingPaymentSession: paymentSessionHookState.isCreatingPaymentSession,
    isPaymentSessionRetryable: false,
    paymentError: null,
    paymentSession: null,
    resetPaymentSession: vi.fn(),
    retryPaymentSession: vi.fn(),
    setPaymentError: vi.fn(),
  }),
}))

vi.mock('./use-checkout-payment-submit', () => ({
  useCheckoutPaymentSubmit: () => ({
    isSubmittingPayment: paymentSubmitHookState.isSubmittingPayment,
    submitPayment: vi.fn(),
  }),
}))

vi.mock('../shipping/use-checkout-selected-shipping-rate', () => ({
  useCheckoutSelectedShippingRate: () => selectedShippingRate,
}))

vi.mock('./use-checkout-stripe-payment-element', () => ({
  useCheckoutStripePaymentElement: () => ({
    handleStripeElementCompleteChange: vi.fn(),
    handleStripeElementReady: vi.fn(),
    handleStripeReady: vi.fn(),
    isStripeElementComplete: false,
    isStripeElementReady: false,
    resetStripePaymentElement: vi.fn(),
    stripePaymentHandleRef: { current: null },
  }),
}))

afterEach(() => {
  cleanup()
  paymentSessionHookState.isCreatingPaymentSession = false
  paymentSubmitHookState.isSubmittingPayment = false
})

const stripePaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const selectedShippingRate: CartShippingRate = {
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
}

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
    email: null,
    id: 'cart_123',
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
    shippingRates: [selectedShippingRate],
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

function renderWithMarket(children: ReactNode) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {children}
    </MarketProvider>,
  )
}

describe('CheckoutPaymentSection', () => {
  it('keeps payment controls interactive while a payment session is initializing', async () => {
    paymentSessionHookState.isCreatingPaymentSession = true
    const handleBusyChange = vi.fn()
    const handleSetupPendingChange = vi.fn()

    renderWithMarket(
      <CheckoutPaymentSection
        cart={checkoutOrder()}
        onBusyChange={handleBusyChange}
        onSetupPendingChange={handleSetupPendingChange}
        shippingReady={false}
      />,
    )

    await waitFor(() => {
      expect(handleBusyChange).toHaveBeenLastCalledWith(false)
      expect(handleSetupPendingChange).toHaveBeenLastCalledWith(true)
    })

    const stripeRadio = screen.getByRole('radio', { name: /stripe/i })

    expect(stripeRadio.hasAttribute('disabled')).toBe(false)
    expect(stripeRadio.getAttribute('aria-disabled')).not.toBe('true')
    expect(
      screen.getByRole('status', { name: 'Initializing secure payment...' }),
    ).toBeTruthy()
    expect(screen.queryByText('Initializing secure payment...')).toBe(null)
  })
})
