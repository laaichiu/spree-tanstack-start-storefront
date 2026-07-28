import {
  applyCheckoutDiscountCode,
  applyCheckoutGiftCardCode,
  createE2EDiscountCode,
  escapeRegExp,
  getCheckoutSummary,
  getCheckoutSummaryAmountDue,
  getCheckoutSummaryTotal,
  provisionE2EGiftCardCode,
} from './checkout-code-helpers'
import {
  prepareCheckoutForPayment,
  startCheckoutWithFirstAvailableProduct,
} from './checkout-flow'
import { submitCheckoutAndExpectOrderPlaced } from './order-completion'
import {
  STRIPE_SUCCESS_CARD,
  fillStripeCard,
  resolveStripeCardFrame,
} from './stripe-payment'
import { HAS_SPREE_DEMO_PATH } from './spree-demo'
import { expect, test } from './test'

test('guest stays payment-ready when a checkout code is invalid', async ({
  page,
}) => {
  const { productName } = await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-invalid-code@example.com',
  })
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)

  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await expect(payNow).toBeEnabled({ timeout: 30_000 })

  const invalidCode = `NOT-A-CODE-${Date.now()}`
  const checkoutCode = page.getByRole('textbox', {
    name: /discount code or gift card/i,
  })
  await checkoutCode.fill(invalidCode)
  await page.getByRole('button', { name: /^apply$/i }).click()

  await expect(page.getByRole('alert').first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(page).toHaveURL(/\/checkout\//)
  await expect(checkoutCode).toHaveValue(invalidCode)
  await expect(page.getByRole('status')).toBeHidden()
  await expect(page.locator('#checkout-section-payment')).toBeVisible()
  await expect(payNow).toBeEnabled({ timeout: 15_000 })
  await expect(
    page.getByText(productName, { exact: false }).first(),
  ).toBeVisible()
  await resolveStripeCardFrame(page)
})

test('guest can apply a discount code and still complete payment', async ({
  page,
}) => {
  test.skip(
    !HAS_SPREE_DEMO_PATH,
    'Set E2E_SPREE_DEMO_PATH to provision an isolated discount code.',
  )

  const discountCode = createE2EDiscountCode()

  await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-discount-code@example.com',
  })

  const originalTotal = await getCheckoutSummaryTotal(page)
  await applyCheckoutDiscountCode(page, discountCode)

  const summary = getCheckoutSummary(page)
  await expect(summary.getByText(/^discount$/i)).toBeVisible()
  await expect(summary).toContainText(/-\s*[$€£¥]?[\d,.]+/)
  await expect(async () => {
    expect(await getCheckoutSummaryTotal(page)).not.toBe(originalTotal)
  }).toPass({ timeout: 30_000 })

  await resolveStripeCardFrame(page)
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
  await submitCheckoutAndExpectOrderPlaced(page)
})

test('guest can remove an applied discount code and continue checkout', async ({
  page,
}) => {
  test.skip(
    !HAS_SPREE_DEMO_PATH,
    'Set E2E_SPREE_DEMO_PATH to provision an isolated discount code.',
  )

  const discountCode = createE2EDiscountCode()

  await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-remove-discount-code@example.com',
  })

  const originalTotal = await getCheckoutSummaryTotal(page)
  await applyCheckoutDiscountCode(page, discountCode)

  await expect(async () => {
    expect(await getCheckoutSummaryTotal(page)).not.toBe(originalTotal)
  }).toPass({ timeout: 30_000 })

  const summary = getCheckoutSummary(page)
  await summary.getByRole('button', { name: /remove discount code/i }).click()

  await expect(
    page.getByRole('status').filter({ hasText: /discount code removed/i }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(summary.getByText(discountCode)).toBeHidden()
  await expect(
    summary.getByRole('button', { name: /remove discount code/i }),
  ).toBeHidden()
  await expect(async () => {
    expect(await getCheckoutSummaryTotal(page)).toBe(originalTotal)
  }).toPass({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/checkout\//)
  await expect(page.locator('#checkout-section-payment')).toBeVisible()
  await resolveStripeCardFrame(page)
})

test('guest can apply and remove a gift card without losing payment readiness', async ({
  page,
}) => {
  const giftCardCode = provisionE2EGiftCardCode()

  test.skip(
    !giftCardCode,
    'Set E2E_GIFT_CARD_CODE or E2E_SPREE_DEMO_PATH to run the gift card checkout smoke test.',
  )

  if (!giftCardCode) return

  await startCheckoutWithFirstAvailableProduct(page)
  await prepareCheckoutForPayment(page, {
    email: 'e2e-gift-card-code@example.com',
  })

  const originalTotal = await getCheckoutSummaryTotal(page)
  await applyCheckoutGiftCardCode(page, giftCardCode)

  const summary = getCheckoutSummary(page)
  await expect(
    summary.getByText(new RegExp(escapeRegExp(giftCardCode), 'i')),
  ).toBeVisible()
  await expect(summary.getByText(/gift card \/ store credit/i)).toBeVisible()
  await expect(summary.getByText(/^amount due$/i)).toBeVisible()
  await expect(async () => {
    expect(await getCheckoutSummaryTotal(page)).toBe(originalTotal)
  }).toPass({ timeout: 30_000 })
  await expect(async () => {
    expect(await getCheckoutSummaryAmountDue(page)).not.toBe(originalTotal)
  }).toPass({ timeout: 30_000 })

  await summary.getByRole('button', { name: /remove gift card/i }).click()

  await expect(
    page.getByRole('status').filter({ hasText: /gift card removed/i }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    summary.getByRole('button', { name: /remove gift card/i }),
  ).toBeHidden()
  await expect(
    summary.getByText(new RegExp(escapeRegExp(giftCardCode), 'i')),
  ).toBeHidden()
  await expect(summary.getByText(/gift card \/ store credit/i)).toBeHidden()
  await expect(summary.getByText(/^amount due$/i)).toBeHidden()
  await expect(async () => {
    expect(await getCheckoutSummaryTotal(page)).toBe(originalTotal)
  }).toPass({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/checkout\//)
  await expect(page.locator('#checkout-section-payment')).toBeVisible()
  await resolveStripeCardFrame(page)
})
