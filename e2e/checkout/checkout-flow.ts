import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import {
  expectStripePaymentFrameExpanded,
  resolveStripeCardFrame,
} from './stripe-payment'

const TEST_EMAIL = 'e2e-buyer@example.com'

export const CHECKOUT_RESPONSIVE_VIEWPORTS = [
  { height: 844, name: 'mobile', width: 390 },
  { height: 1024, name: 'tablet', width: 768 },
  { height: 1000, name: 'desktop', width: 1440 },
  { height: 1117, name: 'wide', width: 1728 },
] as const

export async function addFirstAvailableProductToCart(page: Page) {
  await page.goto('/us/en/products')

  const productLinks = page.getByRole('link', { name: /^view /i })
  await expect(productLinks.first()).toBeVisible({ timeout: 15_000 })

  let productHrefs: Array<string> = []
  await expect(async () => {
    productHrefs = await productLinks.evaluateAll((links) =>
      links
        .map((link) => (link instanceof HTMLAnchorElement ? link.href : ''))
        .filter(Boolean),
    )

    expect(productHrefs.length).toBeGreaterThan(0)
  }).toPass({ timeout: 15_000 })

  for (const productHref of productHrefs.slice(0, 8)) {
    await page.goto(productHref)

    const addToCart = page.getByRole('button', { name: /add to cart/i })
    await expect(addToCart).toBeVisible({ timeout: 15_000 })

    if (!(await addToCart.isEnabled())) {
      continue
    }

    const productName = (
      await page.getByRole('heading', { level: 1 }).innerText()
    ).trim()

    await addToCart.click()

    let checkoutHref = await getDrawerCheckoutHref(page, 10_000)

    if (!checkoutHref) {
      checkoutHref = await getCartPageCheckoutHref(page)
    }

    if (!checkoutHref) {
      await page.goto(productHref)
      await expect(addToCart).toBeVisible({ timeout: 15_000 })
      await addToCart.press('Enter')
      checkoutHref = await getDrawerCheckoutHref(page, 15_000)
    }

    if (!checkoutHref) {
      checkoutHref = await getCartPageCheckoutHref(page)
    }

    if (checkoutHref) {
      return {
        checkoutHref,
        productHref,
        productName,
      }
    }
  }

  throw new Error('No available product could be added to the cart')
}

export async function startCheckoutWithFirstAvailableProduct(page: Page) {
  const product = await addFirstAvailableProductToCart(page)

  await page.goto(product.checkoutHref)

  return product
}

export async function prepareCheckoutForPayment(
  page: Page,
  { email = TEST_EMAIL }: { email?: string } = {},
) {
  await fillDeliveryAddress(page)
  await page.getByRole('textbox', { name: /^email$/i }).fill(email)
  await selectFirstShippingRate(page)
  const paymentSection = page.locator('#checkout-section-payment')
  await expect(paymentSection).toBeVisible()
  await paymentSection.scrollIntoViewIfNeeded()
  await resolveStripeCardFrame(page, 45_000)
}

export async function selectFirstShippingRate(page: Page) {
  await page.getByRole('heading', { name: /shipping method/i }).click()

  const shippingMethods = await expectCheckoutShippingMethods(page)

  const firstShippingRate = shippingMethods.getByRole('radio').first()
  await expect(firstShippingRate).toBeVisible({ timeout: 30_000 })
  await firstShippingRate.click()
  await expect(firstShippingRate).toBeChecked({ timeout: 15_000 })
  await expectExpressCheckoutRemainsAvailable(page)
}

export async function expectCheckoutShippingMethods(page: Page) {
  const shippingMethods = page.getByTestId('checkout-shipping-methods')
  await expect(shippingMethods).toBeVisible({ timeout: 30_000 })

  return shippingMethods
}

export async function expectExpressCheckoutRemainsAvailable(page: Page) {
  const expressCheckout = page.getByTestId('checkout-express-checkout')

  await expect(expressCheckout).toBeVisible({ timeout: 15_000 })
  await expect(expressCheckout.locator('iframe')).not.toHaveCount(0)
}

export async function expectCheckoutResponsiveLayout(
  page: Page,
  viewportName: string,
) {
  if (viewportName === 'mobile') {
    const summaryToggle = page.getByRole('button', {
      name: /order summary/i,
    })
    const mobileSummaryPanel = page.locator('#checkout-mobile-summary')

    await expect(summaryToggle).toHaveAttribute('aria-expanded', 'false')
    await expect(mobileSummaryPanel).toBeHidden()

    await summaryToggle.click()
    await expect(summaryToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(mobileSummaryPanel).toBeVisible()

    await summaryToggle.click()
    await expect(summaryToggle).toHaveAttribute('aria-expanded', 'false')
    await expect(mobileSummaryPanel).toBeHidden()
  }

  await expect(page.getByRole('heading', { name: /^contact$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^delivery$/i })).toBeVisible()

  const shippingMethods = page.getByTestId('checkout-shipping-methods')
  await expect(shippingMethods).toBeVisible()
  await expect(shippingMethods.getByRole('radio').first()).toBeChecked()

  const paymentSection = page.locator('#checkout-section-payment')
  await paymentSection.scrollIntoViewIfNeeded()
  await expect(paymentSection).toBeVisible()
  await expect(
    paymentSection
      .locator('iframe[title="Secure payment input frame"]')
      .first(),
  ).toBeVisible()
  await expectStripePaymentFrameExpanded(page)

  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await expect(payNow).toBeEnabled({ timeout: 30_000 })

  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    const body = document.body
    const viewportWidth = window.innerWidth

    return Math.max(
      documentElement.scrollWidth - viewportWidth,
      body.scrollWidth - viewportWidth,
    )
  })

  expect(
    overflow,
    `${viewportName} checkout should not overflow`,
  ).toBeLessThanOrEqual(2)
}

export async function fillDeliveryAddress(page: Page) {
  await page.getByLabel(/country/i).selectOption({ value: 'US' })
  await page
    .getByRole('textbox', { name: /first name/i })
    .first()
    .fill('Theresa')
  await page
    .getByRole('textbox', { name: /last name/i })
    .first()
    .fill('Chavez')
  await page
    .getByRole('textbox', { name: /^address$/i })
    .first()
    .fill('3909 Hood Avenue')
  await page
    .getByRole('textbox', { name: /^city$/i })
    .first()
    .fill('San Diego')
  await page
    .getByLabel(/state|province/i)
    .first()
    .selectOption({ value: 'CA' })
  await page
    .getByRole('textbox', { name: /postal code/i })
    .first()
    .fill('92121')
  await page
    .getByRole('textbox', { name: /^phone$/i })
    .first()
    .fill('18587790443')
}

export async function fillDifferentBillingAddress(page: Page) {
  const paymentSection = page.locator('#checkout-section-payment')
  const useDifferentBillingAddress = paymentSection.getByRole('radio', {
    name: /use a different billing address/i,
  })

  await useDifferentBillingAddress.click()
  await expect(useDifferentBillingAddress).toBeChecked()

  const billingCountry = page.locator('#checkout-billing-country')
  await expect(billingCountry).toBeVisible()
  await billingCountry.selectOption({ value: 'US' })

  await paymentSection
    .getByRole('textbox', { name: /first name/i })
    .fill('Morgan')
  await paymentSection
    .getByRole('textbox', { name: /last name/i })
    .fill('Billing')
  await paymentSection
    .getByRole('textbox', { name: /^address$/i })
    .fill('600 Montgomery Street')
  await paymentSection
    .getByRole('textbox', { name: /^city$/i })
    .fill('San Francisco')
  await page.locator('#checkout-billing-state').selectOption({ value: 'CA' })
  await paymentSection
    .getByRole('textbox', { name: /postal code/i })
    .fill('94111')

  const billingPhone = paymentSection.getByRole('textbox', {
    name: /phone \(optional\)/i,
  })
  await expect(billingPhone).toHaveAttribute('placeholder', 'Phone (optional)')
}

async function getDrawerCheckoutHref(page: Page, timeout: number) {
  const checkoutLink = page
    .getByRole('dialog')
    .getByRole('link', { name: /^checkout$/i })

  try {
    await checkoutLink.waitFor({ state: 'visible', timeout })
    return await checkoutLink.getAttribute('href')
  } catch {
    return null
  }
}

async function getCartPageCheckoutHref(page: Page) {
  await page.goto('/us/en/cart')

  const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i })

  try {
    await checkoutLink.waitFor({ state: 'visible', timeout: 10_000 })
    return await checkoutLink.getAttribute('href')
  } catch {
    return null
  }
}
