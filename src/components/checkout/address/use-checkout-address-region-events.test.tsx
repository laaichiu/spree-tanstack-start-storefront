import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useForm } from 'react-hook-form'

import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import { useCheckoutBillingAddressFormEvents } from './use-checkout-billing-address-form-events'
import { useCheckoutDeliveryAddressFormEvents } from './use-checkout-delivery-address-form-events'

const addressDefaults: CheckoutAddressInput = {
  address1: '',
  address2: '',
  city: '',
  company: '',
  countryIso: 'US',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  postalCode: '',
  stateAbbr: '',
  stateName: '',
}

const billingAddressDefaults: CheckoutBillingAddressInput = {
  ...addressDefaults,
  phone: '',
}

afterEach(cleanup)

describe('checkout address region events', () => {
  it('does not validate an empty delivery state during country changes', () => {
    const { result } = renderHook(() => {
      const form = useForm<CheckoutAddressInput>({
        defaultValues: addressDefaults,
      })
      const events = useCheckoutDeliveryAddressFormEvents({
        clearCheckoutSectionError: vi.fn(),
        form,
        handleAddressBlur: vi.fn(),
        markShippingRatesStale: vi.fn(),
        scheduleAutoSaveAddress: vi.fn(),
        selectedSavedAddressId: null,
        setSelectedSavedAddressId: vi.fn(),
        syncDeliveryFormValuesFromDom: vi.fn(),
      })

      return { events, form }
    })

    act(() => {
      result.current.events.handleCountryChange('CA')
    })

    expect(result.current.form.getValues()).toMatchObject({
      countryIso: 'CA',
      stateAbbr: '',
      stateName: '',
    })
    expect(result.current.form.formState.errors.stateName).toBeUndefined()
  })

  it('does not validate an empty billing state during country changes', () => {
    const { result } = renderHook(() => {
      const billingForm = useForm<CheckoutBillingAddressInput>({
        defaultValues: billingAddressDefaults,
      })
      const events = useCheckoutBillingAddressFormEvents({
        billingForm,
        billingMode: 'different',
        clearCheckoutSectionError: vi.fn(),
        syncBillingFormValuesFromDom: vi.fn(),
      })

      return { billingForm, events }
    })

    act(() => {
      result.current.events.handleBillingCountryChange('CA')
    })

    expect(result.current.billingForm.getValues()).toMatchObject({
      countryIso: 'CA',
      stateAbbr: '',
      stateName: '',
    })
    expect(
      result.current.billingForm.formState.errors.stateName,
    ).toBeUndefined()
  })
})
