import type { Page } from '@playwright/test'

import { expect, test } from './test'
import {
  clickAddToCartAndWaitForServerFn,
  prepareCheckoutForPayment,
} from './checkout-flow'
import {
  expectCartClearedAfterCheckout,
  expectOrderPlacedSurvivesServerReload,
  failNextCompleteCheckoutOrder,
  submitCheckoutAndExpectConfirmPaymentRecovery,
  submitCheckoutAndExpectOrderPlaced,
} from './order-completion'
import { HAS_ORDER_GROUP_FIXTURE } from './spree-demo'
import { STRIPE_SUCCESS_CARD, fillStripeCard } from './stripe-payment'

const products = [
  {
    name: 'Apple AirPods Verification',
    slug: 'apple-airpods-verification',
  },
  {
    name: 'Automatic Espresso Machine',
    slug: 'automatic-espresso-machine',
  },
]

async function prepareMultiSellerCheckout(page: Page, email: string) {
  for (const product of products) {
    await page.goto(`/us/en/products/${product.slug}`)
    const newsletterClose = page
      .getByRole('dialog')
      .getByRole('button', { name: /close/i })
    if (await newsletterClose.isVisible().catch(() => false)) {
      await newsletterClose.click()
    }
    const addToCart = page.getByRole('button', { name: /add to cart/i })
    await expect(addToCart).toBeEnabled()
    expect(await clickAddToCartAndWaitForServerFn(page, addToCart)).toBe(true)
  }

  await page.goto('/us/en/cart')
  for (const product of products) {
    await expect(
      page.getByText(product.name, { exact: false }).first(),
    ).toBeVisible()
  }

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i })
  await expect(checkoutLink).toBeVisible()
  await checkoutLink.click()
  await prepareCheckoutForPayment(page, { email })
  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
}

test('guest completes a seller and first-party cart as an OrderGroup', async ({
  browser,
  page,
}) => {
  test.skip(
    !HAS_ORDER_GROUP_FIXTURE,
    'Requires an attested multi-seller fixture or a local Spree demo app',
  )

  await prepareMultiSellerCheckout(page, 'e2e-order-group-browser@example.com')
  await submitCheckoutAndExpectOrderPlaced(page)

  await expect(page).toHaveURL(/\/order-placed\/ogrp_[\w-]+/)
  for (const product of products) {
    await expect(
      page.getByText(product.name, { exact: false }).first(),
    ).toBeVisible()
  }

  const orderGroupUrl = page.url()
  await expectOrderPlacedSurvivesServerReload(page)
  await expectCartClearedAfterCheckout(page, products[0].name)

  const unrelatedSession = await browser.newPage()
  try {
    await unrelatedSession.goto(orderGroupUrl)
    await expect(
      unrelatedSession.getByRole('heading', {
        name: /order details are unavailable/i,
      }),
    ).toBeVisible()
  } finally {
    await unrelatedSession.close()
  }
})

test('guest recovers an OrderGroup after the completion response is lost', async ({
  page,
}) => {
  test.skip(
    !HAS_ORDER_GROUP_FIXTURE,
    'Requires an attested multi-seller fixture or a local Spree demo app',
  )

  await prepareMultiSellerCheckout(page, 'e2e-order-group-recovery@example.com')
  const completionFailure = await failNextCompleteCheckoutOrder(page, {
    afterBackendSuccess: true,
  })

  await submitCheckoutAndExpectConfirmPaymentRecovery(page, completionFailure)
  expect(completionFailure.wasIntercepted()).toBe(true)
  expect(completionFailure.backendSucceeded()).toBe(true)
  await expect(page).toHaveURL(/\/order-placed\/ogrp_[\w-]+/)
  await expectOrderPlacedSurvivesServerReload(page)
})
