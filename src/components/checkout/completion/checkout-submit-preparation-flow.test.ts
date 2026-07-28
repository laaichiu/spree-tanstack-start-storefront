import type { UseFormReturn } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import { prepareCheckoutPaymentSubmission } from './checkout-submit-preparation-flow'

function invalidAddress() {
  return {
    address1: '',
    address2: '',
    city: '',
    company: '',
    countryIso: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    postalCode: '',
    stateAbbr: '',
    stateName: '',
  }
}

describe('prepareCheckoutPaymentSubmission', () => {
  it('validates the DOM-synced delivery form before persisting checkout state', async () => {
    const trigger = vi.fn().mockResolvedValue(true)
    const scrollToCheckoutSection = vi.fn()
    const persistCheckoutAddress = vi.fn()

    const result = await prepareCheckoutPaymentSubmission({
      billingForm: {
        trigger: vi.fn().mockResolvedValue(true),
      } as unknown as UseFormReturn<CheckoutBillingAddressInput>,
      billingMode: 'same',
      cart: {} as CheckoutOrder,
      ensureSelectedCheckoutShippingRate: vi.fn(),
      form: {
        trigger,
      } as unknown as UseFormReturn<CheckoutAddressInput>,
      handleSyncedBillingFields: vi.fn(),
      paymentStateKey: 'cart_123:current',
      persistBillingAddress: vi.fn(),
      persistCheckoutAddress,
      scrollToCheckoutSection,
      selectedShippingRate: null,
      setCheckoutError: vi.fn(),
      setCheckoutSectionErrorsAndScroll: vi.fn(),
      setSingleCheckoutSectionError: vi.fn(),
      syncBillingFormValuesFromDom: vi.fn(),
      syncDeliveryFormValuesFromDom: vi.fn().mockReturnValue({
        changedFields: [],
        values: invalidAddress(),
      }),
      t: (key) => key,
    })

    expect(result).toEqual({ type: 'invalid' })
    expect(trigger).toHaveBeenCalledOnce()
    expect(scrollToCheckoutSection).toHaveBeenCalledWith('address')
    expect(persistCheckoutAddress).not.toHaveBeenCalled()
  })
})
