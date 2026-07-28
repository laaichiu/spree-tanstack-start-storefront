import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutPaymentMethodList } from './checkout-payment-method-list'

afterEach(() => {
  cleanup()
})

function renderWithMarket(element: ReactElement) {
  const market = getDefaultResolvedMarket()

  return render(
    <MarketProvider market={market} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

const paymentMethods: Array<CheckoutPaymentMethod> = [
  {
    description: 'Secure card payment',
    gatewayId: 'stripe',
    id: 'pm-stripe',
    name: 'Stripe',
    sessionRequired: true,
    type: 'SpreeStripe::Gateway',
  },
  {
    description: null,
    gatewayId: 'unknown',
    id: 'pm-direct',
    name: 'Manual payment',
    sessionRequired: false,
    type: 'Spree::PaymentMethod::Check',
  },
]

function renderPaymentMethodList({
  onPaymentMethodChange = () => {},
  selectedPaymentMethodId = 'pm-stripe',
}: {
  onPaymentMethodChange?: (paymentMethodId: string) => void
  selectedPaymentMethodId?: string
} = {}) {
  return renderWithMarket(
    <CheckoutPaymentMethodList
      disabled={false}
      methods={paymentMethods}
      onPaymentMethodChange={onPaymentMethodChange}
      renderPaymentMethodBody={(method) => (
        <div data-testid="selected-payment-method-body">
          Body for {method.name}
        </div>
      )}
      selectedPaymentMethodId={selectedPaymentMethodId}
    />,
  )
}

describe('CheckoutPaymentMethodList', () => {
  it('renders payment methods without exposing session implementation labels', () => {
    renderPaymentMethodList()

    expect(screen.getByText('Stripe')).toBeTruthy()
    expect(screen.getByText('Secure card payment')).toBeTruthy()
    expect(screen.getByText('Manual payment')).toBeTruthy()
    expect(screen.queryByText('Session')).toBeNull()
  })

  it('only renders the selected payment method body', () => {
    renderPaymentMethodList({
      selectedPaymentMethodId: 'pm-direct',
    })

    expect(screen.getByTestId('selected-payment-method-body').textContent).toBe(
      'Body for Manual payment',
    )
    expect(screen.queryByText('Body for Stripe')).toBeNull()
  })

  it('notifies the parent when a different method is selected', () => {
    const handlePaymentMethodChange = vi.fn()

    renderPaymentMethodList({
      onPaymentMethodChange: handlePaymentMethodChange,
    })

    fireEvent.click(screen.getByText('Manual payment'))

    expect(handlePaymentMethodChange).toHaveBeenCalledWith('pm-direct')
  })
})
