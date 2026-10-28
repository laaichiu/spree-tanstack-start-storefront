import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutSavedPaymentCardsView } from './checkout-saved-payment-cards-view'

afterEach(cleanup)

const model = {
  addNewLabel: 'Add new payment method',
  cards: [
    {
      description: 'Expires 12/30',
      isDefault: true,
      label: 'Visa ending in 4242',
      value: 'card_1',
    },
  ],
  defaultLabel: 'Default',
  disabled: false,
  selectedPaymentProfileId: null,
  title: 'Saved payment methods',
} as const

describe('CheckoutSavedPaymentCardsView', () => {
  it('forwards a selected saved payment profile id', () => {
    const onChange = vi.fn()

    render(
      <CheckoutSavedPaymentCardsView
        model={model}
        onSavedPaymentProfileChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /Visa ending in 4242/ }))

    expect(onChange).toHaveBeenCalledWith('card_1')
  })

  it('normalizes the add-new option to a null profile id', () => {
    const onChange = vi.fn()

    render(
      <CheckoutSavedPaymentCardsView
        model={{ ...model, selectedPaymentProfileId: 'card_1' }}
        onSavedPaymentProfileChange={onChange}
      />,
    )

    fireEvent.click(
      screen.getByRole('radio', { name: 'Add new payment method' }),
    )

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
