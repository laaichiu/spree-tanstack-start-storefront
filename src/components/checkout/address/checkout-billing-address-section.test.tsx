import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CheckoutBillingAddressInput } from '@/lib/checkout/validation/address'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutBillingAddressSection } from './checkout-billing-address-section'

vi.mock('@/components/shared/address-region-fields', async () => {
  const React = await import('react')

  return {
    AddressCountryField: ({
      id,
      labels,
      value,
    }: {
      id: string
      labels: { country: string }
      value: string
    }) =>
      React.createElement('input', {
        'aria-label': labels.country,
        id,
        value,
        readOnly: true,
      }),
    AddressStateField: ({
      inputId,
      labels,
      stateName,
    }: {
      inputId: string
      labels: { state: string }
      stateName: string
    }) =>
      React.createElement('input', {
        'aria-label': labels.state,
        id: inputId,
        value: stateName,
        readOnly: true,
      }),
  }
})

afterEach(() => {
  cleanup()
})

type BillingAddressSectionProps = ComponentProps<
  typeof CheckoutBillingAddressSection
>

const labels: BillingAddressSectionProps['labels'] = {
  country: 'Country',
  countryLoadFailed: 'Countries failed to load',
  countryPlaceholder: 'Select country',
  loadingStates: 'Loading states',
  state: 'State',
  statePlaceholder: 'Select state',
  stateTextPlaceholder: 'State',
}

const defaultValues: CheckoutBillingAddressInput = {
  address1: '123 Main Street',
  address2: '',
  city: 'New York',
  company: '',
  countryIso: 'US',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '',
  postalCode: '10001',
  stateAbbr: 'NY',
  stateName: '',
}

function BillingAddressHarness({
  overrides = {},
}: {
  overrides?: Partial<BillingAddressSectionProps>
}) {
  const billingForm = useForm<CheckoutBillingAddressInput>({
    defaultValues,
  })
  const props: BillingAddressSectionProps = {
    billingCountryIso: 'US',
    billingForm,
    billingMode: 'different',
    billingStateAbbr: 'NY',
    billingStateName: '',
    disabled: false,
    labels,
    onBillingCountryChange: vi.fn(),
    onBillingStateAbbrChange: vi.fn(),
    onBillingStateNameChange: vi.fn(),
    onModeChange: vi.fn(),
    ...overrides,
  }

  return <CheckoutBillingAddressSection {...props} />
}

function renderWithMarket(element: ReactElement) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

describe('CheckoutBillingAddressSection', () => {
  it('keeps the billing fields boundary controlled by mode and disabled state', () => {
    const onAutofillSync = vi.fn()

    renderWithMarket(
      <BillingAddressHarness
        overrides={{
          disabled: true,
          onAutofillSync,
        }}
      />,
    )

    const fields = document.getElementById('checkout-billing-address-fields')

    expect(fields).toBeTruthy()
    expect(
      screen
        .getByRole('textbox', { name: /first name/i })
        .hasAttribute('disabled'),
    ).toBe(true)

    if (!fields) {
      throw new Error('Billing address fields did not render.')
    }

    fireEvent.click(fields)

    expect(onAutofillSync).toHaveBeenCalled()
  })

  it('keeps billing-specific phone copy and field ids', () => {
    renderWithMarket(<BillingAddressHarness />)

    expect(
      screen.getByRole('textbox', { name: /phone \(optional\)/i }),
    ).toBeTruthy()
    expect(document.getElementById('checkout-billing-country')).toBeTruthy()
    expect(document.getElementById('checkout-billing-state-name')).toBeTruthy()
  })

  it('reports a billing mode change to the parent', () => {
    const onModeChange = vi.fn()

    renderWithMarket(
      <BillingAddressHarness
        overrides={{
          onModeChange,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /same as shipping/i }))

    expect(onModeChange).toHaveBeenCalledWith('same')
  })
})
