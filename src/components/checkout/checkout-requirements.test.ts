import { describe, expect, it } from 'vitest'

import type {
  CheckoutOrder,
  CheckoutRequirement,
} from '@/lib/checkout/model/checkout'

import {
  getBlockingCheckoutRequirementsNotice,
  getCheckoutSectionElementId,
  getFirstCheckoutSectionWithErrors,
  getSingleCheckoutSectionErrors,
  groupCheckoutRequirementsBySection,
  removeCheckoutSectionError,
} from './checkout-requirements'

function requirement(step: string, message: string): CheckoutRequirement {
  return {
    field: step,
    message,
    step,
  }
}

function checkoutOrder(
  requirements: CheckoutRequirement[] = [],
): CheckoutOrder {
  return {
    amountDue: {
      amount: 10,
      currencyCode: 'USD',
    },
    appliedDiscounts: [],
    appliedGiftCard: null,
    billingAddress: null,
    completedSteps: ['address'],
    currencyCode: 'USD',
    currentStep: 'delivery',
    deliveryTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    discountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    email: null,
    id: 'cart_123',
    items: [],
    itemCount: 1,
    itemTotal: {
      amount: 10,
      currencyCode: 'USD',
    },
    number: 'R123456789',
    paymentMethods: [],
    requirements,
    shippingAddress: null,
    shippingDiscountTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    shippingMatchesBillingAddress: true,
    shippingRates: [],
    taxTotal: {
      amount: 0,
      currencyCode: 'USD',
    },
    total: {
      amount: 10,
      currencyCode: 'USD',
    },
  }
}

describe('checkout requirements', () => {
  it('maps Spree checkout steps to storefront checkout sections', () => {
    expect(
      groupCheckoutRequirementsBySection([
        requirement('address', 'Enter a shipping address.'),
        requirement('delivery', 'Select a shipping method.'),
        requirement('payment', 'Choose a payment method.'),
      ]),
    ).toEqual({
      address: ['Enter a shipping address.'],
      payment: ['Choose a payment method.'],
      shipping: ['Select a shipping method.'],
    })
  })

  it('builds a blocking requirements notice from non-payment requirements', () => {
    expect(
      getBlockingCheckoutRequirementsNotice({
        fallbackMessage: 'Complete delivery details.',
        order: checkoutOrder([
          requirement('delivery', 'Select a shipping method.'),
          requirement('payment', 'Choose a payment method.'),
        ]),
      }),
    ).toEqual({
      message: 'Select a shipping method.',
      sectionErrors: {
        shipping: ['Select a shipping method.'],
      },
    })
  })

  it('returns null when there are no blocking delivery requirements', () => {
    expect(
      getBlockingCheckoutRequirementsNotice({
        fallbackMessage: 'Complete delivery details.',
        order: checkoutOrder([requirement('payment', 'Choose a card.')]),
      }),
    ).toBeNull()
  })

  it('returns the first checkout section with errors in page order', () => {
    expect(
      getFirstCheckoutSectionWithErrors({
        payment: ['Payment is incomplete.'],
        shipping: ['Shipping is incomplete.'],
      }),
    ).toBe('shipping')
  })

  it('builds a single checkout section error map', () => {
    expect(
      getSingleCheckoutSectionErrors('payment', 'Payment is incomplete.'),
    ).toEqual({
      payment: ['Payment is incomplete.'],
    })
  })

  it('removes errors for a single checkout section', () => {
    expect(
      removeCheckoutSectionError(
        {
          address: ['Enter a shipping address.'],
          shipping: ['Select a shipping method.'],
        },
        'address',
      ),
    ).toEqual({
      shipping: ['Select a shipping method.'],
    })
  })

  it('keeps the existing error map when the section has no errors', () => {
    const sectionErrors = {
      shipping: ['Select a shipping method.'],
    }

    expect(removeCheckoutSectionError(sectionErrors, 'payment')).toBe(
      sectionErrors,
    )
  })

  it('builds stable checkout section element ids for error scrolling', () => {
    expect(getCheckoutSectionElementId('address')).toBe(
      'checkout-section-address',
    )
    expect(getCheckoutSectionElementId('shipping')).toBe(
      'checkout-section-shipping',
    )
    expect(getCheckoutSectionElementId('payment')).toBe(
      'checkout-section-payment',
    )
  })
})
