import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartShippingRate } from '@/lib/cart/model/cart'

import {
  CheckoutShippingMethods,
  shouldShowCheckoutShippingMethodsPlaceholder,
} from './checkout-shipping-methods'

vi.mock('@/components/shared/product-price', () => ({
  ProductPrice: () => null,
}))

afterEach(() => {
  cleanup()
})

function shippingRate(
  overrides: Partial<CartShippingRate> = {},
): CartShippingRate {
  return {
    deliveryMethodId: 'delivery-method-1',
    fulfillmentId: 'fulfillment-1',
    id: 'rate-1',
    name: 'Standard',
    displayPrice: {
      amount: 0,
      currencyCode: 'USD',
    },
    price: {
      amount: 0,
      currencyCode: 'USD',
    },
    selected: true,
    ...overrides,
  }
}

describe('checkout shipping methods display state', () => {
  it('keeps stale shipping rates hidden while shipping methods are updating', () => {
    expect(
      shouldShowCheckoutShippingMethodsPlaceholder({
        hasRates: true,
        isUpdating: true,
      }),
    ).toBe(true)
  })

  it('shows shipping rates only when rates exist and they are current', () => {
    expect(
      shouldShowCheckoutShippingMethodsPlaceholder({
        hasRates: true,
        isUpdating: false,
      }),
    ).toBe(false)
  })

  it('shows the placeholder when Spree has not returned rates', () => {
    expect(
      shouldShowCheckoutShippingMethodsPlaceholder({
        hasRates: false,
        isUpdating: false,
      }),
    ).toBe(true)
  })

  it('confirms the selected rate again when it is clicked', () => {
    const selectedRate = shippingRate()
    const onSelect = vi.fn()

    render(
      createElement(CheckoutShippingMethods, {
        disabled: false,
        onSelect,
        placeholder: 'Choose a shipping method',
        rates: [selectedRate],
        selectedRateId: selectedRate.id,
      }),
    )

    fireEvent.click(screen.getByRole('radio', { name: selectedRate.name }))

    expect(onSelect).toHaveBeenCalledWith(selectedRate)
  })

  it('does not confirm the selected rate again while disabled', () => {
    const selectedRate = shippingRate()
    const onSelect = vi.fn()

    render(
      createElement(CheckoutShippingMethods, {
        disabled: true,
        onSelect,
        placeholder: 'Choose a shipping method',
        rates: [selectedRate],
        selectedRateId: selectedRate.id,
      }),
    )

    fireEvent.click(screen.getByRole('radio', { name: selectedRate.name }))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
