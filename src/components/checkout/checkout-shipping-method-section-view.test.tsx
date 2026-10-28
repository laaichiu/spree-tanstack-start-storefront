import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckoutShippingMethodSectionView } from './checkout-shipping-method-section-view'

afterEach(cleanup)

describe('CheckoutShippingMethodSectionView', () => {
  it('renders the section heading, errors and shipping methods directly', () => {
    render(
      <CheckoutShippingMethodSectionView
        methods={<div>Shipping method choices</div>}
        model={{
          errors: ['Choose a shipping method'],
          id: 'checkout-shipping',
          title: 'Shipping method',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Shipping method' }),
    ).toBeTruthy()
    expect(screen.getByText('Choose a shipping method')).toBeTruthy()
    expect(screen.getByText('Shipping method choices')).toBeTruthy()
  })
})
