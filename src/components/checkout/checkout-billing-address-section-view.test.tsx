import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutBillingAddressSectionView } from './checkout-billing-address-section-view'

afterEach(cleanup)

describe('CheckoutBillingAddressSectionView', () => {
  it('forwards billing mode changes and renders the different-address fields', () => {
    const onModeChange = vi.fn()

    const view = render(
      <CheckoutBillingAddressSectionView
        model={{
          billingMode: 'same',
          differentLabel: 'Use a different billing address',
          disabled: false,
          sameLabel: 'Same as shipping address',
          title: 'Billing address',
        }}
        onModeChange={onModeChange}
        slots={{ fields: <div>Billing address fields</div> }}
      />,
    )

    fireEvent.click(
      screen.getByRole('radio', { name: 'Use a different billing address' }),
    )

    expect(onModeChange).toHaveBeenCalledWith('different')

    view.rerender(
      <CheckoutBillingAddressSectionView
        model={{
          billingMode: 'different',
          differentLabel: 'Use a different billing address',
          disabled: false,
          sameLabel: 'Same as shipping address',
          title: 'Billing address',
        }}
        onModeChange={onModeChange}
        slots={{ fields: <div>Billing address fields</div> }}
      />,
    )

    expect(screen.getByText('Billing address fields')).toBeTruthy()
  })
})
