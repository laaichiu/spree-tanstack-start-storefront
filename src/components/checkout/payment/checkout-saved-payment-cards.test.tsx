import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutSavedPaymentCards } from './checkout-saved-payment-cards'

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
  {
    brand: 'master',
    default: false,
    expiryMonth: 12,
    expiryYear: 2031,
    gatewayPaymentProfileId: 'pm_saved_backup',
    id: 'card_backup',
    last4: '4444',
    name: null,
  },
]

describe('CheckoutSavedPaymentCards', () => {
  it('renders saved cards with expiry and default status', () => {
    renderWithMarket(
      <CheckoutSavedPaymentCards
        cards={savedCards}
        onSavedPaymentProfileChange={() => {}}
        selectedPaymentProfileId="pm_saved_default"
      />,
    )

    expect(screen.getByText('Saved payment methods')).toBeTruthy()
    expect(screen.getByText('VISA ending in 4242')).toBeTruthy()
    expect(screen.getByText('Expires 04/2030')).toBeTruthy()
    expect(screen.getByText('Default')).toBeTruthy()
    expect(screen.getByText('Add new payment method')).toBeTruthy()
  })

  it('maps add-new selection back to null', () => {
    const handleChange = vi.fn()

    renderWithMarket(
      <CheckoutSavedPaymentCards
        cards={savedCards}
        onSavedPaymentProfileChange={handleChange}
        selectedPaymentProfileId="pm_saved_default"
      />,
    )

    fireEvent.click(screen.getByText('Add new payment method'))

    expect(handleChange).toHaveBeenCalledWith(null)
  })
})
