import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps, ReactElement } from 'react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutDeliverySection } from './checkout-delivery-section'
import { getCheckoutSectionElementId } from '../checkout-requirements'

vi.mock('@/components/shared/address-region-fields', async () => {
  const React = await import('react')

  return {
    AddressCountryField: ({
      id,
      labels,
      name,
      onBlur,
      onCountryChange,
      value,
    }: {
      id: string
      labels: { country: string }
      name?: string
      onBlur?: () => void
      onCountryChange: (countryIso: string) => void
      value: string
    }) =>
      React.createElement(
        'label',
        null,
        labels.country,
        React.createElement(
          'select',
          {
            'aria-label': labels.country,
            id,
            name,
            onBlur,
            onChange: (event: unknown) =>
              onCountryChange(
                (event as { currentTarget: { value: string } }).currentTarget
                  .value,
              ),
            value,
          },
          React.createElement('option', { value: 'US' }, 'United States'),
          React.createElement('option', { value: 'CA' }, 'Canada'),
        ),
      ),
    AddressStateField: ({
      inputId,
      inputName,
      labels,
      onBlur,
      onStateNameChange,
      stateName,
    }: {
      inputId: string
      inputName?: string
      labels: { state: string }
      onBlur?: () => void
      onStateNameChange: (stateName: string) => void
      stateName: string
    }) =>
      React.createElement(
        'label',
        null,
        labels.state,
        React.createElement('input', {
          'aria-label': labels.state,
          id: inputId,
          name: inputName,
          onBlur,
          onChange: (event: unknown) =>
            onStateNameChange(
              (event as { currentTarget: { value: string } }).currentTarget
                .value,
            ),
          value: stateName,
        }),
      ),
  }
})

afterEach(() => {
  cleanup()
})

type CheckoutDeliverySectionProps = ComponentProps<
  typeof CheckoutDeliverySection
>

const defaultAddressValues: CheckoutAddressInput = {
  address1: '123 Main Street',
  address2: '',
  city: 'New York',
  company: '',
  countryIso: 'US',
  email: 'guest@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '555-123-4567',
  postalCode: '10001',
  stateAbbr: 'NY',
  stateName: '',
}

const savedAddress: CustomerAddress = {
  address1: '456 Maple Avenue',
  address2: null,
  city: 'Boston',
  company: null,
  countryIso: 'US',
  countryName: 'United States',
  firstName: 'Ada',
  fullName: 'Ada Lovelace',
  id: 'addr_123',
  isDefaultBilling: false,
  isDefaultShipping: true,
  lastName: 'Lovelace',
  phone: '555-111-2222',
  postalCode: '02108',
  quickCheckout: false,
  stateAbbr: 'MA',
  stateName: null,
  stateText: 'MA',
}

const shippingRate: CartShippingRate = {
  deliveryMethodId: 'delivery-method-1',
  displayPrice: {
    amount: 0,
    currencyCode: 'USD',
  },
  fulfillmentId: 'fulfillment-1',
  id: 'rate-ground',
  name: 'Ground',
  price: {
    amount: 0,
    currencyCode: 'USD',
  },
  selected: true,
}

const labels: CheckoutDeliverySectionProps['address']['labels'] = {
  country: 'Country',
  countryLoadFailed: 'Countries failed to load',
  countryPlaceholder: 'Select country',
  loadingStates: 'Loading states',
  state: 'State',
  statePlaceholder: 'Select state',
  stateTextPlaceholder: 'State',
}

type CheckoutDeliverySectionOverrides = {
  address?: Partial<CheckoutDeliverySectionProps['address']>
  contact?: Partial<CheckoutDeliverySectionProps['contact']>
  shipping?: Partial<CheckoutDeliverySectionProps['shipping']>
}

function renderWithMarket(element: ReactElement) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

function CheckoutDeliverySectionHarness({
  overrides = {},
}: {
  overrides?: CheckoutDeliverySectionOverrides
}) {
  const deliveryForm = useForm<CheckoutAddressInput>({
    defaultValues: defaultAddressValues,
  })
  const props: CheckoutDeliverySectionProps = {
    address: {
      countryIso: defaultAddressValues.countryIso,
      deliveryForm,
      isCheckoutPending: false,
      isCheckoutSubmitting: false,
      labels,
      onCountryChange: vi.fn(),
      onRegionBlur: vi.fn(),
      onSelectSavedAddress: vi.fn(),
      onStateAbbrChange: vi.fn(),
      onStateNameChange: vi.fn(),
      onUseManualAddress: vi.fn(),
      savedAddresses: [savedAddress],
      selectedSavedAddressId: null,
      stateAbbr: defaultAddressValues.stateAbbr,
      stateName: defaultAddressValues.stateName,
      ...overrides.address,
    },
    contact: {
      accountLoginHref: '/account/login',
      addressErrors: undefined,
      authenticatedCustomerEmail: null,
      deliveryForm,
      ...overrides.contact,
    },
    onBlurCapture: vi.fn(),
    onChangeCapture: vi.fn(),
    onClickCapture: vi.fn(),
    onFocusCapture: vi.fn(),
    onInputCapture: vi.fn(),
    onPointerDownCapture: vi.fn(),
    onSubmit: vi.fn(),
    shipping: {
      onSelectShippingRate: vi.fn(),
      selectedShippingRateId: shippingRate.id,
      shippingDisabled: false,
      shippingErrors: undefined,
      shippingMethodsUpdating: false,
      shippingPlaceholder: 'Enter your delivery address to see shipping.',
      shippingRates: [shippingRate],
      ...overrides.shipping,
    },
  }

  return <CheckoutDeliverySection {...props} />
}

function renderDeliverySection(
  overrides: CheckoutDeliverySectionOverrides = {},
) {
  return renderWithMarket(
    <CheckoutDeliverySectionHarness overrides={overrides} />,
  )
}

describe('CheckoutDeliverySection', () => {
  it('uses the stable checkout section ids needed by error scrolling', () => {
    renderDeliverySection()

    expect(
      document.getElementById(getCheckoutSectionElementId('address')),
    ).toBeTruthy()
    expect(
      document.getElementById(getCheckoutSectionElementId('shipping')),
    ).toBeTruthy()
  })

  it('keeps saved address selection parent-owned', () => {
    const handleSelectSavedAddress = vi.fn()

    renderDeliverySection({
      address: { onSelectSavedAddress: handleSelectSavedAddress },
    })

    fireEvent.click(screen.getByRole('radio', { name: /ada lovelace/i }))

    expect(handleSelectSavedAddress).toHaveBeenCalledWith(savedAddress)
  })

  it('hides manual address fields when a saved address is selected', () => {
    renderDeliverySection({
      address: { selectedSavedAddressId: savedAddress.id },
    })

    expect(screen.queryByRole('textbox', { name: /^address$/i })).toBeNull()
    expect(
      screen
        .getByRole('radio', {
          name: /ada lovelace/i,
        })
        .getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('shows manual address fields when a different address is selected', () => {
    renderDeliverySection({
      address: { selectedSavedAddressId: null },
    })

    expect(screen.getByRole('textbox', { name: /^address$/i })).toBeTruthy()
    expect(
      screen
        .getByRole('radio', { name: /use a different address/i })
        .getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('shows manual address fields when the customer has no saved addresses', () => {
    renderDeliverySection({
      address: { savedAddresses: [], selectedSavedAddressId: null },
    })

    expect(screen.getByRole('textbox', { name: /^address$/i })).toBeTruthy()
    expect(screen.queryByText(/saved addresses/i)).toBeNull()
  })

  it('keeps delivery-specific phone copy and field ids', () => {
    renderDeliverySection({
      address: { savedAddresses: [], selectedSavedAddressId: null },
    })

    expect(screen.getByRole('textbox', { name: /^phone$/i })).toBeTruthy()
    expect(document.getElementById('checkout-delivery-country')).toBeTruthy()
    expect(document.getElementById('checkout-delivery-state-name')).toBeTruthy()
  })

  it('keeps shipping rate selection parent-owned', () => {
    const handleSelectShippingRate = vi.fn()

    renderDeliverySection({
      shipping: { onSelectShippingRate: handleSelectShippingRate },
    })

    fireEvent.click(screen.getByRole('radio', { name: /ground/i }))

    expect(handleSelectShippingRate).toHaveBeenCalledWith(shippingRate)
  })

  it('disables the authenticated contact field and removes the sign-in action', () => {
    renderDeliverySection({
      contact: { authenticatedCustomerEmail: 'member@example.com' },
    })

    expect(screen.queryByRole('link', { name: /sign in/i })).toBeNull()
    expect(
      screen.getByRole('textbox', { name: /email/i }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('renders shipping errors inside the stable shipping section', () => {
    renderDeliverySection({
      shipping: {
        shippingErrors: ['Shipping is unavailable for this address.'],
      },
    })

    expect(
      screen.getByText('Shipping is unavailable for this address.'),
    ).toBeTruthy()
    expect(
      document.getElementById(getCheckoutSectionElementId('shipping')),
    ).toBeTruthy()
  })
})
