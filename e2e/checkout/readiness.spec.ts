import {
  CHECKOUT_RESPONSIVE_VIEWPORTS,
  addFirstAvailableProductToCart,
  expectCheckoutResponsiveLayout,
  expectCheckoutShippingMethods,
  expectExpressCheckoutRemainsAvailable,
  fillDeliveryAddress,
  selectFirstShippingRate,
  startCheckoutWithFirstAvailableProduct,
} from './checkout-flow'
import {
  STRIPE_SUCCESS_CARD,
  expectStripePaymentFrameExpanded,
  fillStripeCard,
  resolveStripeCardFrame,
} from './stripe-payment'
import { expect, test } from './test'

test('cart survives reload and remains usable across responsive viewports', async ({
  page,
}) => {
  const { productHref, productName } =
    await addFirstAvailableProductToCart(page)

  await page.goto(productHref)
  await page.reload()
  await expect(page.getByRole('button', { name: /add to cart/i })).toBeEnabled({
    timeout: 15_000,
  })

  await page.goto('/us/en/cart')
  await expect(
    page.getByText(productName, { exact: false }).first(),
  ).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByRole('link', { name: /proceed to checkout/i }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByText(productName, { exact: false }).first(),
  ).toBeVisible({
    timeout: 15_000,
  })

  for (const viewport of CHECKOUT_RESPONSIVE_VIEWPORTS) {
    await page.setViewportSize(viewport)
    await expect(
      page.getByText(productName, { exact: false }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /proceed to checkout/i }),
    ).toBeVisible()

    const overflow = await page.evaluate(() => {
      const documentElement = document.documentElement
      const body = document.body

      return Math.max(
        documentElement.scrollWidth - window.innerWidth,
        body.scrollWidth - window.innerWidth,
      )
    })

    expect(
      overflow,
      `${viewport.name} cart should not overflow`,
    ).toBeLessThanOrEqual(2)
  }
})

test('guest sees shipping methods and payment after entering a valid delivery address', async ({
  page,
}) => {
  await startCheckoutWithFirstAvailableProduct(page)

  await fillDeliveryAddress(page)
  await page
    .getByRole('textbox', { name: /^email$/i })
    .fill('e2e-checkout-ready@example.com')

  const shippingMethods = await expectCheckoutShippingMethods(page)
  const firstShippingRate = shippingMethods.getByRole('radio').first()
  await firstShippingRate.click()
  await expect(firstShippingRate).toBeChecked({ timeout: 15_000 })
  await expectExpressCheckoutRemainsAvailable(page)

  const paymentSection = page.locator('#checkout-section-payment')
  await expect(paymentSection).toBeVisible()
  await paymentSection.scrollIntoViewIfNeeded()
  await resolveStripeCardFrame(page, 45_000)

  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await expect(payNow).toBeEnabled({ timeout: 30_000 })

  await fillStripeCard(page, STRIPE_SUCCESS_CARD)
  await expect(payNow).toBeEnabled({ timeout: 30_000 })
})

test('pay now validates required checkout fields without generic delivery banners', async ({
  page,
}) => {
  await startCheckoutWithFirstAvailableProduct(page)

  const deliverySection = page.locator('#checkout-section-delivery')
  const paymentSection = page.locator('#checkout-section-payment')
  await expect(
    deliverySection.getByRole('textbox', { name: /^phone$/i }),
  ).toHaveAttribute('placeholder', 'Phone')
  await expect(paymentSection).toBeVisible({ timeout: 30_000 })
  await resolveStripeCardFrame(page, 45_000)
  await expectStripePaymentFrameExpanded(page)
  await paymentSection
    .getByRole('radio', { name: /use a different billing address/i })
    .click()
  await expect(paymentSection.getByText(/phone \(optional\)/i)).toBeVisible()
  await expect(
    paymentSection.getByRole('textbox', { name: /phone \(optional\)/i }),
  ).toHaveAttribute('placeholder', 'Phone (optional)')

  const payNow = page.getByRole('button', { name: /pay now|place order/i })
  await expect(payNow).toBeEnabled({ timeout: 30_000 })
  await payNow.click()

  await expect(page).toHaveURL(/\/checkout\//)
  await expect(
    page.getByText(/complete delivery details before paying/i),
  ).toHaveCount(0)
  await expect(
    page.getByText(/complete billing address before paying/i),
  ).toHaveCount(0)
  await expect(page.getByText(/^enter an email\.$/i)).toBeVisible()
  await expect(
    deliverySection.getByText(/^enter a first name\.$/i),
  ).toBeVisible()
  await expect(deliverySection.getByText(/^enter an address\.$/i)).toBeVisible()
  await expect(
    deliverySection.getByText(/^enter a state \/ province\.$/i),
  ).toBeVisible()
  await expect(
    paymentSection.getByText(/^enter a first name\.$/i),
  ).toBeVisible()
  await expect(paymentSection.getByText(/^enter an address\.$/i)).toBeVisible()
  await expect(
    paymentSection.getByText(/^enter a phone number\.$/i),
  ).toHaveCount(0)

  await page
    .getByRole('textbox', { name: /^email$/i })
    .evaluate((emailInput) => {
      const values = {
        address1: '3909 Hood Avenue',
        city: 'San Diego',
        email: 'autofill@example.com',
        firstName: 'Theresa',
        lastName: 'Chavez',
        phone: '8587790443',
        postalCode: '92121',
        stateAbbr: 'CA',
      }

      const checkoutForm = (emailInput as HTMLInputElement).form

      if (!checkoutForm) {
        throw new Error('Checkout address form was not found')
      }

      for (const [name, value] of Object.entries(values)) {
        const element = checkoutForm.elements.namedItem(name)

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement
        ) {
          element.value = value
        }
      }
    })
  await deliverySection.getByRole('textbox', { name: /first name/i }).click()

  await expect(page.getByText(/^enter an email\.$/i)).toHaveCount(0)
  await expect(
    deliverySection.getByText(/^enter a first name\.$/i),
  ).toHaveCount(0)
  await expect(deliverySection.getByText(/^enter a last name\.$/i)).toHaveCount(
    0,
  )
  await expect(deliverySection.getByText(/^enter an address\.$/i)).toHaveCount(
    0,
  )
  await expect(deliverySection.getByText(/^enter a city\.$/i)).toHaveCount(0)
  await expect(
    deliverySection.getByText(/^enter a state \/ province\.$/i),
  ).toHaveCount(0)
  await expect(
    deliverySection.getByText(/^enter a ZIP\/postal code\.$/i),
  ).toHaveCount(0)
  await expect(
    deliverySection.getByText(/^enter a phone number\.$/i),
  ).toHaveCount(0)

  await paymentSection
    .locator('#checkout-billing-address-fields')
    .evaluate((billingFields) => {
      const values = {
        address1: '50 California Street',
        city: 'San Francisco',
        firstName: 'Morgan',
        lastName: 'Billing',
        postalCode: '94111',
      }

      for (const [name, value] of Object.entries(values)) {
        const element = billingFields.querySelector(`[name="${name}"]`)

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement
        ) {
          element.value = value
        }
      }
    })
  await paymentSection.getByRole('textbox', { name: /first name/i }).click()

  await expect(paymentSection.getByText(/^enter a first name\.$/i)).toHaveCount(
    0,
  )
  await expect(paymentSection.getByText(/^enter a last name\.$/i)).toHaveCount(
    0,
  )
  await expect(paymentSection.getByText(/^enter an address\.$/i)).toHaveCount(0)
  await expect(paymentSection.getByText(/^enter a city\.$/i)).toHaveCount(0)
  await expect(
    paymentSection.getByText(/^enter a ZIP\/postal code\.$/i),
  ).toHaveCount(0)
  await expect(paymentSection).toBeVisible()
  await expectStripePaymentFrameExpanded(page)
})

test('changing delivery country does not validate an empty region before submit', async ({
  page,
}) => {
  await startCheckoutWithFirstAvailableProduct(page)

  const deliverySection = page.locator('#checkout-section-delivery')
  await page.locator('#checkout-delivery-country').selectOption({ value: 'CA' })

  await expect(
    deliverySection.getByText(/^enter a state \/ province\.$/i),
  ).toHaveCount(0)
})

test('checkout remains usable across responsive viewports', async ({
  page,
}) => {
  await page.setViewportSize(CHECKOUT_RESPONSIVE_VIEWPORTS[0])
  await startCheckoutWithFirstAvailableProduct(page)
  await fillDeliveryAddress(page)
  await page
    .getByRole('textbox', { name: /^email$/i })
    .fill('e2e-responsive-checkout@example.com')
  await selectFirstShippingRate(page)
  await resolveStripeCardFrame(page, 45_000)

  for (const viewport of CHECKOUT_RESPONSIVE_VIEWPORTS) {
    await page.setViewportSize(viewport)
    await expectCheckoutResponsiveLayout(page, viewport.name)
  }
})
