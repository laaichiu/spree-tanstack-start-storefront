import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'

import { useCheckoutPaymentSelection } from './use-checkout-payment-selection'

afterEach(() => {
  cleanup()
})

const stripePaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'stripe',
  id: 'pm-stripe',
  name: 'Stripe',
  sessionRequired: true,
  type: 'SpreeStripe::Gateway',
}

const directPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'unknown',
  id: 'pm-direct',
  name: 'Manual payment',
  sessionRequired: false,
  type: 'Spree::PaymentMethod::Check',
}

const adyenPaymentMethod: CheckoutPaymentMethod = {
  description: null,
  gatewayId: 'adyen',
  id: 'pm-adyen',
  name: 'Adyen',
  sessionRequired: true,
  type: 'SpreeAdyen::Gateway',
}

const savedPaymentCards: Array<CustomerCreditCard> = [
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
  {
    brand: 'mastercard',
    default: false,
    expiryMonth: 12,
    expiryYear: 2031,
    gatewayPaymentProfileId: 'pm_saved_backup',
    id: 'card_backup',
    last4: '4444',
    name: null,
  },
  {
    brand: 'visa',
    default: false,
    expiryMonth: 6,
    expiryYear: 2032,
    gatewayPaymentProfileId: null,
    id: 'card_without_gateway_profile',
    last4: '1111',
    name: null,
  },
]

function renderCheckoutPaymentSelectionHook({
  paymentMethods = [stripePaymentMethod, directPaymentMethod],
  resetPaymentSession = vi.fn<() => void>(),
  cards = savedPaymentCards,
}: {
  cards?: Array<CustomerCreditCard>
  paymentMethods?: Array<CheckoutPaymentMethod>
  resetPaymentSession?: Mock<() => void>
} = {}) {
  const result = renderHook(
    ({
      currentCards,
      currentPaymentMethods,
    }: {
      currentCards: Array<CustomerCreditCard>
      currentPaymentMethods: Array<CheckoutPaymentMethod>
    }) =>
      useCheckoutPaymentSelection({
        paymentMethods: currentPaymentMethods,
        resetPaymentSession,
        savedPaymentCards: currentCards,
      }),
    {
      initialProps: {
        currentCards: cards,
        currentPaymentMethods: paymentMethods,
      },
    },
  )

  return {
    resetPaymentSession,
    ...result,
  }
}

describe('useCheckoutPaymentSelection', () => {
  it('defaults to the first payment method and default saved Stripe card', () => {
    const { result } = renderCheckoutPaymentSelectionHook()

    expect(result.current.selectedPaymentMethod?.id).toBe('pm-stripe')
    expect(result.current.selectedPaymentMethodId).toBe('pm-stripe')
    expect(
      result.current.savedStripePaymentCards.map((card) => card.id),
    ).toEqual(['card_default', 'card_backup'])
    expect(result.current.selectedSavedPaymentProfileId).toBe(
      'pm_saved_default',
    )
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBe(
      'pm_saved_default',
    )
  })

  it('updates the selected payment method and resets the payment session', () => {
    const { resetPaymentSession, result } = renderCheckoutPaymentSelectionHook()

    act(() => {
      result.current.handlePaymentMethodChange('pm-direct')
    })

    expect(result.current.selectedPaymentMethod?.id).toBe('pm-direct')
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBeNull()
    expect(resetPaymentSession).toHaveBeenCalled()
  })

  it('updates the selected saved payment profile and resets the payment session', () => {
    const { resetPaymentSession, result } = renderCheckoutPaymentSelectionHook()

    act(() => {
      result.current.handleSavedPaymentProfileChange('pm_saved_backup')
    })

    expect(result.current.selectedSavedPaymentProfileId).toBe('pm_saved_backup')
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBe(
      'pm_saved_backup',
    )
    expect(resetPaymentSession).toHaveBeenCalled()

    act(() => {
      result.current.handleSavedPaymentProfileChange(null)
    })

    expect(result.current.selectedSavedPaymentProfileId).toBeNull()
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBeNull()
  })

  it('falls back to the first available payment method when the selected one disappears', async () => {
    const { rerender, resetPaymentSession, result } =
      renderCheckoutPaymentSelectionHook()

    act(() => {
      result.current.handlePaymentMethodChange('pm-direct')
    })
    resetPaymentSession.mockClear()

    rerender({
      currentCards: savedPaymentCards,
      currentPaymentMethods: [stripePaymentMethod],
    })

    await waitFor(() => {
      expect(result.current.selectedPaymentMethod?.id).toBe('pm-stripe')
    })
    expect(result.current.selectedPaymentMethodId).toBe('pm-stripe')
    expect(resetPaymentSession).not.toHaveBeenCalled()
  })

  it('falls back to an available saved card when the selected profile disappears', async () => {
    const { rerender, resetPaymentSession, result } =
      renderCheckoutPaymentSelectionHook()

    const remainingCards = savedPaymentCards.slice(1, 2)
    rerender({
      currentCards: remainingCards,
      currentPaymentMethods: [stripePaymentMethod],
    })

    await waitFor(() => {
      expect(result.current.selectedSavedPaymentProfileId).toBe(
        'pm_saved_backup',
      )
    })
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBe(
      'pm_saved_backup',
    )
    expect(resetPaymentSession).toHaveBeenCalled()
  })

  it('does not expose a saved Stripe profile for unsupported session gateways', () => {
    const { result } = renderCheckoutPaymentSelectionHook({
      paymentMethods: [adyenPaymentMethod],
    })

    expect(result.current.selectedPaymentMethod?.id).toBe('pm-adyen')
    expect(result.current.selectedSavedPaymentProfileId).toBe(
      'pm_saved_default',
    )
    expect(result.current.selectedSavedPaymentProfileIdForSession).toBeNull()
  })
})
