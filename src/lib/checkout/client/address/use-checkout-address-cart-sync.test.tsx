import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/contracts'

import { useCheckoutAddressCartSync } from './use-checkout-address-cart-sync'

const cart = mapSpreeCheckoutToOrder(baseCart, { locale: 'en' })
const address: CheckoutAddressInput = {
  address1: '1 Market Street',
  address2: '',
  city: 'San Francisco',
  company: '',
  countryIso: 'US',
  email: 'shopper@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '555-0100',
  postalCode: '94105',
  stateAbbr: 'CA',
  stateName: 'California',
}
const billingAddress: CheckoutBillingAddressInput = {
  address1: address.address1,
  address2: address.address2,
  city: address.city,
  company: address.company,
  countryIso: address.countryIso,
  firstName: address.firstName,
  lastName: address.lastName,
  phone: address.phone,
  postalCode: address.postalCode,
  stateAbbr: address.stateAbbr,
  stateName: address.stateName,
}

function createOptions(
  market: { country: string; locale: string },
  form = {
    getValues: vi.fn(() => address),
    reset: vi.fn(),
  },
  billingForm = { reset: vi.fn() },
) {
  return {
    billingForm: billingForm as never,
    cart,
    form: form as never,
    initialBillingAddressValues: billingAddress,
    initialShippingAddressValues: address,
    market,
    resetAddressPersistence: vi.fn(),
    savedAddresses: [],
    setAddressBillingMode: vi.fn(),
    setCheckoutSectionErrorsAndScroll: vi.fn(),
    setSelectedSavedAddressId: vi.fn(),
  }
}

afterEach(() => {
  cleanup()
})

describe('checkout address cart sync', () => {
  it('resets address state when the market changes without a cart-id change', () => {
    const form = {
      getValues: vi.fn(() => ({ ...address, email: 'pending@example.com' })),
      reset: vi.fn(),
    }
    const billingForm = { reset: vi.fn() }
    const { rerender } = renderHook(
      ({ market }: { market: { country: string; locale: string } }) =>
        useCheckoutAddressCartSync(createOptions(market, form, billingForm)),
      {
        initialProps: { market: { country: 'us', locale: 'en' } },
      },
    )

    expect(form.reset).not.toHaveBeenCalled()
    expect(billingForm.reset).not.toHaveBeenCalled()

    act(() => {
      rerender({ market: { country: 'us', locale: 'fr' } })
    })

    expect(form.reset).toHaveBeenCalledWith(address)
    expect(billingForm.reset).toHaveBeenCalledWith(billingAddress)
  })
})
