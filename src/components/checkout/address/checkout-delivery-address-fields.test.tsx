import { cleanup, render, screen } from '@testing-library/react'
import type { UseFormReturn } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CheckoutAddressInput } from '@/lib/checkout/contracts'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('./checkout-postal-address-fields', () => ({
  CheckoutPostalAddressFields: ({ disabled }: { disabled?: boolean }) => (
    <input aria-label="manual delivery address" disabled={disabled} />
  ),
}))

afterEach(cleanup)

describe('CheckoutDeliveryAddressFields', () => {
  it('disables manual address inputs while checkout is pending', async () => {
    const { CheckoutDeliveryAddressFields } =
      await import('./checkout-delivery-address-fields')
    const form = {} as UseFormReturn<CheckoutAddressInput>

    const { rerender } = render(
      <CheckoutDeliveryAddressFields
        countryIso="US"
        deliveryForm={form}
        isCheckoutPending
        isCheckoutSubmitting={false}
        labels={{
          country: 'Country',
          countryLoadFailed: 'Unable to load countries',
          countryPlaceholder: 'Select country',
          loadingStates: 'Loading states',
          state: 'State',
          statePlaceholder: 'Select state',
          stateTextPlaceholder: 'State or province',
        }}
        onCountryChange={vi.fn()}
        onRegionBlur={vi.fn()}
        onSelectSavedAddress={vi.fn()}
        onStateAbbrChange={vi.fn()}
        onStateNameChange={vi.fn()}
        onUseManualAddress={vi.fn()}
        savedAddresses={[]}
        selectedSavedAddressId={null}
        stateAbbr=""
        stateName=""
      />,
    )

    expect(screen.getByRole('textbox')).toHaveProperty('disabled', true)

    rerender(
      <CheckoutDeliveryAddressFields
        countryIso="US"
        deliveryForm={form}
        isCheckoutPending={false}
        isCheckoutSubmitting
        labels={{
          country: 'Country',
          countryLoadFailed: 'Unable to load countries',
          countryPlaceholder: 'Select country',
          loadingStates: 'Loading states',
          state: 'State',
          statePlaceholder: 'Select state',
          stateTextPlaceholder: 'State or province',
        }}
        onCountryChange={vi.fn()}
        onRegionBlur={vi.fn()}
        onSelectSavedAddress={vi.fn()}
        onStateAbbrChange={vi.fn()}
        onStateNameChange={vi.fn()}
        onUseManualAddress={vi.fn()}
        savedAddresses={[]}
        selectedSavedAddressId={null}
        stateAbbr=""
        stateName=""
      />,
    )

    expect(screen.getByRole('textbox')).toHaveProperty('disabled', true)
  })
})
