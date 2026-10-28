import {
  fillDifferentBillingAddress,
  prepareCheckoutForPayment,
  startCheckoutWithFirstAvailableProduct,
} from './checkout-flow'
import {
  expectCartClearedAfterCheckout,
  expectOrderPlacedSurvivesServerReload,
  failNextCompleteCheckoutOrder,
  submitCheckoutAndExpectConfirmPaymentRecovery,
  submitCheckoutAndExpectOrderPlaced,
  submitCheckoutAndExpectPaymentFailure,
} from './order-completion'
import {
  STRIPE_DECLINED_CARD,
  STRIPE_SUCCESS_CARD,
  fillStripeCard,
} from './stripe-payment'
import { expect, test } from './test'

test('guest can complete checkout with a Stripe test card', async ({
  page,
}) => {
  const { productName } = await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page)
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
  await submitCheckoutAndExpectOrderPlaced(page)
  await expectOrderPlacedSurvivesServerReload(page)
  await expectCartClearedAfterCheckout(page, productName)
})

test('guest recovers through confirm-payment when order completion settles late', async ({
  page,
}) => {
  const { productName } = await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-confirm-payment-recovery@example.com',
  })
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)

  const completionFailure = await failNextCompleteCheckoutOrder(page)

  await submitCheckoutAndExpectConfirmPaymentRecovery(page, completionFailure)
  expect(completionFailure.wasIntercepted()).toBe(true)
  await expectOrderPlacedSurvivesServerReload(page)
  await expectCartClearedAfterCheckout(page, productName)
})

test('guest stays in checkout when Stripe declines the card and can retry', async ({
  page,
}) => {
  await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page)
  await fillStripeCard(page, STRIPE_DECLINED_CARD)
  await submitCheckoutAndExpectPaymentFailure(page)

  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
  await submitCheckoutAndExpectOrderPlaced(page)
})

test('guest can complete checkout with a different billing address', async ({
  page,
}) => {
  await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-billing-address@example.com',
  })
  await fillDifferentBillingAddress(page)
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
  await submitCheckoutAndExpectOrderPlaced(page)
})
