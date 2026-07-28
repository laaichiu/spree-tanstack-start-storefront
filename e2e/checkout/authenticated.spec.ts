import {
  HAS_SPREE_DEMO_PATH,
  createSavedCustomerAddress,
  expectSavedPaymentCardSelectedForCheckout,
  registerTestCustomer,
  seedCustomerSavedPaymentCard,
  seedCustomerSavedPaymentCardOutsideCurrentStore,
} from './customer'
import {
  fillDeliveryAddress,
  selectFirstShippingRate,
  startCheckoutWithFirstAvailableProduct,
} from './checkout-flow'
import {
  expectCartClearedAfterCheckout,
  expectOrderPlacedSurvivesServerReload,
  submitCheckoutAndExpectOrderPlaced,
} from './order-completion'
import { resolveStripeCardFrame } from './stripe-payment'
import { expect, test } from './test'

const checkoutViewports = [
  { height: 844, width: 390 },
  { height: 1024, width: 768 },
  { height: 1000, width: 1440 },
  { height: 1117, width: 1728 },
]

test('authenticated customer can use a saved delivery address at checkout', async ({
  page,
}) => {
  const email = `e2e-saved-address-${Date.now()}@example.com`
  const savedAddress = {
    address1: '3909 Hood Avenue',
    city: 'San Diego',
    firstName: 'Theresa',
    lastName: 'Chavez',
    phone: '18587790443',
    postalCode: '92121',
    stateAbbr: 'CA',
  }

  await registerTestCustomer(page, email)
  await createSavedCustomerAddress(page, savedAddress)
  await startCheckoutWithFirstAvailableProduct(page)

  const emailInput = page.getByRole('textbox', { name: /^email$/i })
  await expect(emailInput).toBeVisible({ timeout: 15_000 })
  await expect(emailInput).toHaveValue(email, { timeout: 15_000 })

  await expect(page.getByText(/saved addresses/i)).toBeVisible({
    timeout: 30_000,
  })

  const savedAddressRadio = page.getByRole('radio', {
    name: new RegExp(`${savedAddress.firstName} ${savedAddress.lastName}`, 'i'),
  })
  await savedAddressRadio.click()
  await expect(savedAddressRadio).toBeChecked({ timeout: 15_000 })
  await expect(page.getByRole('textbox', { name: /^address$/i })).toHaveCount(0)

  const manualAddressRadio = page.getByRole('radio', {
    name: /use a different address/i,
  })
  await manualAddressRadio.click()
  await expect(manualAddressRadio).toBeChecked()
  await expect(
    page.getByRole('textbox', { name: /^address$/i }).first(),
  ).toHaveValue(savedAddress.address1)

  await savedAddressRadio.click()
  await expect(savedAddressRadio).toBeChecked()
  await expect(page.getByRole('textbox', { name: /^address$/i })).toHaveCount(0)

  for (const viewport of checkoutViewports) {
    await page.setViewportSize(viewport)
    await expect(savedAddressRadio).toBeChecked()
    await expect(page.getByRole('textbox', { name: /^address$/i })).toHaveCount(
      0,
    )
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false)
  }

  await selectFirstShippingRate(page)
  await expect(
    page
      .locator(
        '#checkout-section-payment iframe[title="Secure payment input frame"]',
      )
      .first(),
  ).toBeVisible({ timeout: 45_000 })
})

test('authenticated customer can switch between a saved payment card and a new card', async ({
  page,
}) => {
  test.skip(
    !HAS_SPREE_DEMO_PATH,
    'Set E2E_SPREE_DEMO_PATH to a local spree-demo app to seed saved payment cards.',
  )

  const email = `e2e-saved-card-${Date.now()}@example.com`

  await registerTestCustomer(page, email)
  seedCustomerSavedPaymentCard(email)
  await startCheckoutWithFirstAvailableProduct(page)

  await fillDeliveryAddress(page)
  await selectFirstShippingRate(page)

  const paymentSection = page.locator('#checkout-section-payment')
  await expectSavedPaymentCardSelectedForCheckout(page)

  await paymentSection
    .getByRole('radio', { name: /add new payment method/i })
    .click()

  await resolveStripeCardFrame(page, 45_000)
})

test('checkout excludes saved cards outside the current store payment methods', async ({
  page,
}) => {
  test.skip(
    !HAS_SPREE_DEMO_PATH,
    'Set E2E_SPREE_DEMO_PATH to a local spree-demo app to seed saved payment cards.',
  )

  const email = `e2e-other-store-card-${Date.now()}@example.com`

  await registerTestCustomer(page, email)
  seedCustomerSavedPaymentCardOutsideCurrentStore(email)
  await startCheckoutWithFirstAvailableProduct(page)

  await fillDeliveryAddress(page)
  await selectFirstShippingRate(page)

  const paymentSection = page.locator('#checkout-section-payment')
  await expect(paymentSection.getByText(/saved payment methods/i)).toHaveCount(
    0,
  )
  await expect(paymentSection.getByText(/visa.*0000/i)).toHaveCount(0)
  await resolveStripeCardFrame(page, 45_000)
})

test('authenticated customer can complete checkout with a saved payment card', async ({
  page,
}) => {
  test.skip(
    !HAS_SPREE_DEMO_PATH,
    'Set E2E_SPREE_DEMO_PATH to a local spree-demo app to seed saved payment cards.',
  )

  const email = `e2e-saved-card-order-${Date.now()}@example.com`

  await registerTestCustomer(page, email)
  seedCustomerSavedPaymentCard(email)
  const { productName } = await startCheckoutWithFirstAvailableProduct(page)

  await fillDeliveryAddress(page)
  await selectFirstShippingRate(page)
  await expectSavedPaymentCardSelectedForCheckout(page)
  await submitCheckoutAndExpectOrderPlaced(page)
  await expectOrderPlacedSurvivesServerReload(page)
  await expectCartClearedAfterCheckout(page, productName)
})
