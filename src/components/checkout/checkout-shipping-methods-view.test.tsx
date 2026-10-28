import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutShippingMethodsView } from './checkout-shipping-methods-view'

afterEach(cleanup)

describe('CheckoutShippingMethodsView', () => {
  it('forwards the selected shipping method through the direct callback', () => {
    const onSelect = vi.fn()

    render(
      <CheckoutShippingMethodsView
        model={{
          disabled: false,
          methods: [
            {
              id: 'rate_standard',
              identity: 'rate_standard',
              isSelected: false,
              label: 'Standard delivery',
              price: '$5.00',
            },
          ],
          selectedMethodId: null,
          status: 'methods',
        }}
        onSelect={onSelect}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /Standard delivery/ }))

    expect(onSelect).toHaveBeenCalledWith('rate_standard')
  })
})
