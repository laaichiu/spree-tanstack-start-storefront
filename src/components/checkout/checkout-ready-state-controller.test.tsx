import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CheckoutReadyStateController } from '@/components/checkout/checkout-ready-state-controller'
import { CheckoutReadyStateReferenceView } from '@/components/checkout/checkout-ready-state-reference-view'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

const runtime = vi.hoisted(() => {
  const value: { current: unknown } = { current: null }

  return {
    handleSubmitPayment: vi.fn(async () => undefined),
    onMobileSummaryToggle: vi.fn(),
    value,
  }
})

vi.mock('@/components/checkout/use-checkout-ready-state', () => ({
  useCheckoutReadyStateRuntime: () => runtime.value.current,
}))

vi.mock('@/components/checkout/summary/checkout-summary', () => ({
  CheckoutSummary: ({
    cart,
    isMobileOpen,
    onMobileToggle,
  }: {
    cart: { id: string }
    isMobileOpen: boolean
    onMobileToggle: () => void
  }) => (
    <button data-testid="summary" onClick={onMobileToggle}>
      summary:{cart.id}:{String(isMobileOpen)}
    </button>
  ),
}))

vi.mock('@/components/checkout/express/checkout-express-checkout', () => ({
  CheckoutExpressCheckout: ({ cart }: { cart: { id: string } }) => (
    <output data-testid="express">express:{cart.id}</output>
  ),
}))

vi.mock('@/components/checkout/address/checkout-delivery-section', () => ({
  CheckoutDeliverySection: ({
    shipping,
  }: {
    shipping: {
      selectedShippingRateId: string
      shippingDisabled: boolean
    }
  }) => (
    <output data-testid="delivery">
      {`delivery:${shipping.selectedShippingRateId}:${String(shipping.shippingDisabled)}`}
    </output>
  ),
}))

vi.mock(
  '@/components/checkout/address/checkout-billing-address-section',
  () => ({
    CheckoutBillingAddressSection: ({ disabled }: { disabled: boolean }) => (
      <output data-testid="billing">billing:{String(disabled)}</output>
    ),
  }),
)

vi.mock('@/components/checkout/payment/checkout-payment-section', () => ({
  CheckoutPaymentSection: forwardRef(
    (
      {
        billingAddressSection,
        controlsDisabled,
        shippingReady,
      }: {
        billingAddressSection?: ReactNode
        controlsDisabled?: boolean
        shippingReady: boolean
      },
      _ref,
    ) => (
      <div data-testid="payment">
        payment:{String(controlsDisabled)}:{String(shippingReady)}
        {billingAddressSection}
      </div>
    ),
  ),
}))

vi.mock('@/components/checkout/checkout-consent-notice', () => ({
  CheckoutConsentNotice: () => <output data-testid="consent">consent</output>,
}))

vi.mock('@/components/checkout/completion/checkout-submit-button', () => ({
  CheckoutSubmitButton: ({
    amountDueAmount,
    disabled,
    isPending,
    onSubmit,
  }: {
    amountDueAmount: number
    disabled: boolean
    isPending: boolean
    onSubmit: () => void
  }) => (
    <button data-testid="submit" disabled={disabled} onClick={onSubmit}>
      submit:{amountDueAmount}:{String(isPending)}
    </button>
  ),
}))

const money = (amount: number) => ({ amount, currencyCode: 'USD' })

const checkoutOrder = {
  amountDue: money(42),
  appliedDiscounts: [],
  appliedGiftCard: null,
  billingAddress: null,
  completedSteps: ['address'],
  currencyCode: 'USD',
  currentStep: 'delivery',
  deliveryTotal: money(500),
  discountTotal: money(0),
  email: 'customer@example.com',
  id: 'order-1',
  itemCount: 1,
  itemTotal: money(37),
  items: [
    {
      id: 'line-item-1',
      imageUrl: null,
      name: 'Reference product',
      optionsText: '',
      optionValues: [],
      productSlug: 'reference-product',
      quantity: 1,
      totalPrice: money(37),
      unitPrice: money(37),
      variantId: 'variant-1',
    },
  ],
  paymentMethods: [],
  requirements: [],
  shippingAddress: null,
  shippingDiscountTotal: money(0),
  shippingMatchesBillingAddress: true,
  shippingRates: [
    {
      deliveryMethodId: 'delivery-method-1',
      displayPrice: money(500),
      fulfillmentId: 'fulfillment-1',
      id: 'rate-1',
      name: 'Standard',
      price: money(500),
      selected: true,
    },
  ],
  taxTotal: money(0),
  total: money(42),
} satisfies CheckoutOrder

function createRuntimeValue() {
  const doNothing = vi.fn()

  return {
    accountLoginHref: '/us/en/account/login',
    address: {
      autosave: {
        clearAutoSaveAddressTimeout: doNothing,
      },
      form: {
        billingCountryIso: 'US',
        billingFieldsRef: { current: null },
        billingForm: {},
        billingMode: 'same',
        billingStateAbbr: 'NY',
        billingStateName: '',
        countryIso: 'US',
        deliveryFormRef: { current: null },
        form: { handleSubmit: vi.fn() },
        handleBillingCountryChange: doNothing,
        handleBillingStateAbbrChange: doNothing,
        handleBillingStateNameChange: doNothing,
        handleCountryChange: doNothing,
        handleFormAutoSaveEvent: doNothing,
        handleFormBlur: doNothing,
        handleRegionBlur: doNothing,
        handleStateAbbrChange: doNothing,
        handleStateNameChange: doNothing,
        selectedSavedAddressId: null,
        setBillingMode: doNothing,
        setSelectedSavedAddressId: doNothing,
        stateAbbr: 'NY',
        stateName: '',
        syncBillingFormValuesAfterBrowserAutofill: doNothing,
        syncDeliveryFormValuesAfterBrowserAutofill: doNothing,
      },
      isCheckoutPending: false,
      persistence: {
        handleSaveAddress: doNothing,
        persistCheckoutSavedAddress: doNothing,
      },
      shipping: {
        areShippingMethodsUpdating: false,
        areShippingRatesStale: true,
        handleSelectShippingRate: doNothing,
        hasCurrentShippingSelection: true,
        selectedShippingRateId: 'rate-1',
        shippingMethodPlaceholder: 'Delivery',
      },
    },
    authenticatedCustomerEmail: 'customer@example.com',
    cart: checkoutOrder,
    checkoutError: 'Review the highlighted checkout details.',
    deliveryRegionLabels: {},
    handleSubmitPayment: runtime.handleSubmitPayment,
    hasSessionPaymentMethod: true,
    isCheckoutSubmitting: false,
    isMobileSummaryOpen: true,
    isPaymentBusy: false,
    isPaymentSubmitQueued: false,
    isSubmitDisabled: false,
    onMobileSummaryToggle: runtime.onMobileSummaryToggle,
    onPaymentBusyChange: doNothing,
    onPaymentReadyChange: doNothing,
    onPaymentSetupPendingChange: doNothing,
    paymentSectionRef: { current: null },
    savedAddresses: [],
    savedPaymentCards: [],
    sectionErrors: {
      address: [],
      payment: [],
      shipping: [],
    },
  }
}

beforeEach(() => {
  runtime.value.current = createRuntimeValue()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CheckoutReadyStateController', () => {
  it('exposes protected summary, express, delivery, payment, and submit slots', () => {
    render(
      <CheckoutReadyStateController cart={checkoutOrder}>
        {(controller) => (
          <CheckoutReadyStateReferenceView controller={controller} />
        )}
      </CheckoutReadyStateController>,
    )

    expect(screen.getByTestId('summary').textContent).toBe(
      'summary:order-1:true',
    )
    expect(screen.getByTestId('express').textContent).toBe('express:order-1')
    expect(screen.getByTestId('delivery').textContent).toBe(
      'delivery:rate-1:true',
    )
    expect(screen.getByTestId('payment').textContent).toContain(
      'payment:false:true',
    )
    expect(screen.getByTestId('billing').textContent).toBe('billing:false')
    expect(screen.getByTestId('consent')).toBeTruthy()
    expect(screen.getByTestId('submit').textContent).toBe('submit:42:false')
    expect(
      screen.getByText('Review the highlighted checkout details.'),
    ).toBeTruthy()

    fireEvent.click(screen.getByTestId('summary'))
    fireEvent.click(screen.getByTestId('submit'))

    expect(runtime.onMobileSummaryToggle).toHaveBeenCalledOnce()
    expect(runtime.handleSubmitPayment).toHaveBeenCalledOnce()
  })
})
