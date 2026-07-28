import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutPaymentMethodBody } from './checkout-payment-method-body'

const stripePaymentElementSpy = vi.hoisted(() => vi.fn())

vi.mock('./stripe-payment-element', async () => {
  const React = await import('react')

  return {
    StripePaymentElement: (props: { clientSecret: string }) => {
      stripePaymentElementSpy(props)

      return React.createElement(
        'div',
        { 'data-testid': 'stripe-payment-element' },
        props.clientSecret,
      )
    },
  }
})

afterEach(() => {
  cleanup()
  stripePaymentElementSpy.mockClear()
})

function renderWithMarket(element: ReactElement) {
  const market = getDefaultResolvedMarket()

  return render(
    <MarketProvider market={market} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

const directPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'unknown',
  id: 'pm-direct',
  name: 'Manual payment',
  sessionRequired: false,
  type: 'Spree::PaymentMethod::Check',
}

const stripePaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const paypalPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'paypal',
  id: 'pm-paypal',
  name: 'PayPal',
  sessionRequired: true,
  type: 'SpreePaypalCheckout::Gateway',
}

const paymentSession: CheckoutPaymentSession = {
  amount: {
    amount: 129,
    currencyCode: 'USD',
  },
  currencyCode: 'USD',
  customerExternalId: null,
  expiresAt: null,
  externalData: {
    client_secret: 'pi_test_secret',
  },
  externalId: null,
  id: 'ps_123',
  orderId: 'cart_123',
  paymentMethodId: 'pm-stripe',
  status: 'processing',
}

const savedCards: Array<CheckoutSavedPaymentCard> = [
  {
    brand: 'visa',
    default: true,
    expiryMonth: 4,
    expiryYear: 2030,
    gatewayPaymentProfileId: 'pm_saved_default',
    id: 'card_default',
    last4: '4242',
    name: 'Theresa Chavez',
  },
]

function renderPaymentMethodBody(
  props: Partial<Parameters<typeof CheckoutPaymentMethodBody>[0]> = {},
) {
  return renderWithMarket(
    <CheckoutPaymentMethodBody
      clientSecret={undefined}
      disabled={false}
      isBusy={false}
      isPaymentSessionRetryable={false}
      method={directPaymentMethod}
      onSavedPaymentProfileChange={() => {}}
      onStripeElementCompleteChange={() => {}}
      onStripeElementReady={() => {}}
      onStripeReady={() => {}}
      onRetryPaymentSession={() => {}}
      paymentError={null}
      paymentSession={null}
      savedPaymentCards={[]}
      selectedSavedPaymentProfileId={null}
      {...props}
    />,
  )
}

describe('CheckoutPaymentMethodBody', () => {
  it('shows direct payment readiness for non-session methods', () => {
    renderPaymentMethodBody()

    expect(
      screen.getByText(
        'This payment method will be created when you place the order.',
      ),
    ).toBeTruthy()
  })

  it('shows a disabled payment hint while payment controls are unavailable', () => {
    renderPaymentMethodBody({
      disabled: true,
    })

    expect(
      screen.getByText(
        'Enter your delivery address and choose a shipping method to continue to payment.',
      ),
    ).toBeTruthy()
  })

  it('shows unsupported session gateway messaging without mounting Stripe', () => {
    renderPaymentMethodBody({
      method: paypalPaymentMethod,
    })

    expect(
      screen.getByText(
        'This session payment method is not supported in the storefront yet.',
      ),
    ).toBeTruthy()
    expect(stripePaymentElementSpy).not.toHaveBeenCalled()
  })

  it('shows a payment form skeleton while Stripe setup is initializing', () => {
    renderPaymentMethodBody({
      isBusy: true,
      method: stripePaymentMethod,
      paymentSession: null,
    })

    expect(
      screen.getByRole('status', { name: 'Initializing secure payment...' }),
    ).toBeTruthy()
    expect(screen.queryByText('Initializing secure payment...')).toBe(null)
    expect(stripePaymentElementSpy).not.toHaveBeenCalled()
  })

  it('uses the saved Stripe card path without mounting the Payment Element', () => {
    renderPaymentMethodBody({
      clientSecret: 'pi_test_secret',
      method: stripePaymentMethod,
      paymentSession,
      savedPaymentCards: savedCards,
      selectedSavedPaymentProfileId: 'pm_saved_default',
    })

    expect(
      screen.getByText('Saved card is ready for secure confirmation.'),
    ).toBeTruthy()
    expect(stripePaymentElementSpy).not.toHaveBeenCalled()
  })

  it('mounts the Stripe Payment Element when adding a new card', () => {
    renderPaymentMethodBody({
      clientSecret: 'pi_test_secret',
      method: stripePaymentMethod,
      paymentSession,
      savedPaymentCards: savedCards,
      selectedSavedPaymentProfileId: null,
    })

    expect(screen.getByTestId('stripe-payment-element')).toBeTruthy()
    expect(stripePaymentElementSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: 'pi_test_secret',
      }),
    )
  })

  it('offers payment session retry when Stripe setup failed before client secret exists', () => {
    const handleRetry = vi.fn()

    renderPaymentMethodBody({
      isPaymentSessionRetryable: true,
      method: stripePaymentMethod,
      onRetryPaymentSession: handleRetry,
      paymentError: 'Gateway offline',
      paymentSession: null,
    })

    const retry = screen.getByRole('button', {
      name: 'Retry payment setup',
    })

    fireEvent.click(retry)

    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('does not show payment setup retry for card confirmation errors', () => {
    renderPaymentMethodBody({
      clientSecret: 'pi_test_secret',
      isPaymentSessionRetryable: true,
      method: stripePaymentMethod,
      paymentError: 'Card declined',
      paymentSession,
    })

    expect(screen.queryByRole('button', { name: 'Retry payment setup' })).toBe(
      null,
    )
  })

  it('does not show payment setup retry for non-retryable setup errors', () => {
    renderPaymentMethodBody({
      isPaymentSessionRetryable: false,
      method: stripePaymentMethod,
      paymentError:
        'Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.',
      paymentSession: null,
    })

    expect(screen.queryByRole('button', { name: 'Retry payment setup' })).toBe(
      null,
    )
  })
})
