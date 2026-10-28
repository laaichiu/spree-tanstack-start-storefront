// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import type {
  CheckoutAddressInput,
  CheckoutOrder,
} from '@/lib/checkout/contracts'

import { prepareCheckoutPaymentSubmission } from './checkout-submit-preparation'
import type { CheckoutSubmitPreparationOptions } from './checkout-submit-preparation'

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

const checkoutOrder = {
  amountDue: { amount: 25, currencyCode: 'USD' },
  appliedDiscounts: [],
  appliedGiftCard: null,
  billingAddress: null,
  completedSteps: [],
  currencyCode: 'USD',
  currentStep: 'payment',
  deliveryTotal: null,
  discountTotal: null,
  email: address.email,
  id: 'cart_123',
  itemCount: 1,
  itemTotal: null,
  items: [],
  paymentMethods: [],
  payments: [],
  requirements: [],
  shippingAddress: null,
  shippingDiscountTotal: null,
  shippingMatchesBillingAddress: true,
  shippingRates: [],
  taxTotal: null,
  total: { amount: 25, currencyCode: 'USD' },
} satisfies CheckoutOrder

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function createOptions(
  overrides: Partial<CheckoutSubmitPreparationOptions> = {},
) {
  return {
    cart: checkoutOrder,
    ensureSelectedCheckoutShippingRate: vi
      .fn()
      .mockResolvedValue(checkoutOrder),
    persistBillingAddress: vi.fn().mockResolvedValue(checkoutOrder),
    persistCheckoutAddress: vi.fn().mockResolvedValue(checkoutOrder),
    paymentStateKey: 'cart_123:USD::::25',
    selectedShippingRate: null,
    setCheckoutError: vi.fn(),
    setCheckoutSectionErrorsAndScroll: vi.fn(),
    setSingleCheckoutSectionError: vi.fn(),
    t: (key: string) => key,
    validateForms: vi.fn().mockResolvedValue({
      address,
      type: 'valid' as const,
    }),
    ...overrides,
  }
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('checkout submit preparation lifecycle', () => {
  it('aborts before address persistence when validation becomes stale', async () => {
    const validation = createDeferred<{
      address: CheckoutAddressInput
      type: 'valid'
    }>()
    let current = true
    const options = createOptions({
      isCurrent: () => current,
      validateForms: vi.fn(() => validation.promise),
    })

    const preparation = prepareCheckoutPaymentSubmission(options)
    current = false
    validation.resolve({ address, type: 'valid' })

    await expect(preparation).resolves.toEqual({ type: 'abort' })
    expect(options.persistCheckoutAddress).not.toHaveBeenCalled()
  })

  it('aborts before billing when delivery selection becomes stale', async () => {
    const deliverySelection = createDeferred<CheckoutOrder>()
    let current = true
    const options = createOptions({
      ensureSelectedCheckoutShippingRate: vi.fn(
        () => deliverySelection.promise,
      ),
      isCurrent: () => current,
    })

    const preparation = prepareCheckoutPaymentSubmission(options)
    await flushPromises()
    expect(options.ensureSelectedCheckoutShippingRate).toHaveBeenCalledOnce()

    current = false
    deliverySelection.resolve(checkoutOrder)

    await expect(preparation).resolves.toEqual({ type: 'abort' })
    expect(options.persistBillingAddress).not.toHaveBeenCalled()
    expect(options.setCheckoutError).not.toHaveBeenCalled()
    expect(options.setSingleCheckoutSectionError).not.toHaveBeenCalled()
  })

  it('aborts before the payment shipping ensure when billing becomes stale', async () => {
    const billingPersistence = createDeferred<CheckoutOrder>()
    const ensureSelectedCheckoutShippingRate = vi
      .fn()
      .mockResolvedValue(checkoutOrder)
    let current = true
    const options = createOptions({
      ensureSelectedCheckoutShippingRate,
      isCurrent: () => current,
      persistBillingAddress: vi.fn(() => billingPersistence.promise),
    })

    const preparation = prepareCheckoutPaymentSubmission(options)
    await flushPromises()
    expect(options.persistBillingAddress).toHaveBeenCalledOnce()

    current = false
    billingPersistence.resolve(checkoutOrder)

    await expect(preparation).resolves.toEqual({ type: 'abort' })
    expect(ensureSelectedCheckoutShippingRate).toHaveBeenCalledOnce()
    expect(options.setCheckoutError).not.toHaveBeenCalled()
  })

  it('aborts before returning a payment action when the final ensure is stale', async () => {
    const paymentEnsure = createDeferred<CheckoutOrder>()
    const ensureSelectedCheckoutShippingRate = vi
      .fn()
      .mockResolvedValueOnce(checkoutOrder)
      .mockReturnValueOnce(paymentEnsure.promise)
    let current = true
    const options = createOptions({
      ensureSelectedCheckoutShippingRate,
      isCurrent: () => current,
    })

    const preparation = prepareCheckoutPaymentSubmission(options)
    await flushPromises()
    expect(ensureSelectedCheckoutShippingRate).toHaveBeenCalledTimes(2)

    current = false
    paymentEnsure.resolve(checkoutOrder)

    await expect(preparation).resolves.toEqual({ type: 'abort' })
    expect(options.setCheckoutError).not.toHaveBeenCalled()
    expect(options.setCheckoutSectionErrorsAndScroll).not.toHaveBeenCalled()
  })
})
