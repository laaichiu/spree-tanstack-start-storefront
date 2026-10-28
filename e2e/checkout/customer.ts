import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import { HAS_SPREE_DEMO_PATH, runSpreeDemoScript } from './spree-demo'

export { HAS_SPREE_DEMO_PATH }

type SavedAddress = {
  address1: string
  city: string
  firstName: string
  lastName: string
  phone: string
  postalCode: string
  stateAbbr: string
}

export async function registerTestCustomer(page: Page, email: string) {
  const password = 'Password123!'

  await page.goto('/us/en/account/register')

  await expect(async () => {
    const signOutButton = page.getByRole('button', { name: /sign out/i })

    if (await signOutButton.isVisible().catch(() => false)) {
      return
    }

    const registerForm = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: /create account/i }) })
    const firstName = registerForm.locator('input[name="firstName"]')
    const lastName = registerForm.locator('input[name="lastName"]')
    const emailInput = registerForm.locator('input[name="email"]')
    const passwordInput = registerForm.locator('input[name="password"]')
    const passwordConfirmation = registerForm.locator(
      'input[name="passwordConfirmation"]',
    )

    await firstName.fill('Theresa')
    await lastName.fill('Chavez')
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await passwordConfirmation.fill(password)

    await expect(firstName).toHaveValue('Theresa')
    await expect(lastName).toHaveValue('Chavez')
    await expect(emailInput).toHaveValue(email)
    await expect(passwordInput).toHaveValue(password)
    await expect(passwordConfirmation).toHaveValue(password)

    await page.getByRole('button', { name: /create account/i }).click()
    await expect(signOutButton).toBeVisible({ timeout: 10_000 })
  }).toPass({ timeout: 45_000 })
}

export async function createSavedCustomerAddress(
  page: Page,
  address: SavedAddress,
) {
  await page.goto('/us/en/account/addresses')

  await expect(async () => {
    await page.getByRole('button', { name: /add address/i }).click()
    await expect(
      page.getByRole('heading', { name: /^add address$/i }),
    ).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 15_000 })

  const addressForm = page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: /save address/i }) })
  const firstName = addressForm.locator('input[name="firstName"]')
  const lastName = addressForm.locator('input[name="lastName"]')
  const address1 = addressForm.locator('input[name="address1"]')
  const city = addressForm.locator('input[name="city"]')
  const postalCode = addressForm.locator('input[name="postalCode"]')
  const phone = addressForm.locator('input[name="phone"]')

  await expect(async () => {
    await firstName.fill(address.firstName)
    await lastName.fill(address.lastName)
    await address1.fill(address.address1)
    await city.fill(address.city)
    await postalCode.fill(address.postalCode)
    await page.locator('#account-address-country').selectOption({ value: 'US' })
    await page.locator('#account-address-state').selectOption({
      value: address.stateAbbr,
    })
    await phone.fill(address.phone)

    await expect(firstName).toHaveValue(address.firstName)
    await expect(lastName).toHaveValue(address.lastName)
    await expect(address1).toHaveValue(address.address1)
    await expect(city).toHaveValue(address.city)
    await expect(postalCode).toHaveValue(address.postalCode)
    await expect(phone).toHaveValue(address.phone)
  }).toPass({ timeout: 15_000 })

  await addressForm.getByRole('checkbox', { name: /default shipping/i }).check()
  await addressForm.getByRole('button', { name: /save address/i }).click()

  await expect(
    page.getByRole('heading', { name: /^add address$/i }),
  ).toBeHidden({ timeout: 30_000 })
  await expect(
    page.getByText(`${address.firstName} ${address.lastName}`).first(),
  ).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(address.address1).first()).toBeVisible()
}

export function seedCustomerSavedPaymentCard(email: string) {
  const script = `
email = ENV.fetch("E2E_CUSTOMER_EMAIL")
store = Spree::Store.default || Spree::Store.first
user = Spree.user_class.find_by!(email: email)
payment_method =
  store.payment_methods.where(type: "SpreeStripe::Gateway").first ||
  Spree::PaymentMethod.where(type: "SpreeStripe::Gateway").first
raise "SpreeStripe::Gateway payment method is required." unless payment_method
card = user.credit_cards.find_or_initialize_by(gateway_payment_profile_id: "pm_card_visa")
card.payment_method = payment_method
card.name = "E2E Saved Card"
card.month = 12
card.year = 2030
card.cc_type = "visa"
card.last_digits = "4242"
card.default = true
card.save!
puts card.id
`

  runSpreeDemoScript(script, {
    E2E_CUSTOMER_EMAIL: email,
  })
}

export function seedCustomerSavedPaymentCardOutsideCurrentStore(email: string) {
  const script = `
email = ENV.fetch("E2E_CUSTOMER_EMAIL")
store = Spree::Store.default || Spree::Store.first
user = Spree.user_class.find_by!(email: email)
payment_method = Spree::Gateway::Bogus.find_or_initialize_by(
  name: "E2E Legacy Unscoped Gateway"
)

if payment_method.new_record?
  payment_method.store = store
  payment_method.active = false
  payment_method.save!
end

payment_method.update_column(:store_id, nil) if payment_method.store_id.present?

card = user.credit_cards.find_or_initialize_by(
  gateway_payment_profile_id: "pm_e2eunscoped#{user.id}"
)
card.payment_method = payment_method
card.name = "Unscoped Legacy Card"
card.month = 12
card.year = 2030
card.cc_type = "visa"
card.last_digits = "0000"
card.default = true
card.save!
puts "seeded"
`

  runSpreeDemoScript(script, {
    E2E_CUSTOMER_EMAIL: email,
  })
}

export async function expectSavedPaymentCardSelectedForCheckout(page: Page) {
  const paymentSection = page.locator('#checkout-section-payment')

  await expect(paymentSection.getByText(/saved payment methods/i)).toBeVisible({
    timeout: 30_000,
  })
  await expect(paymentSection.getByText(/visa.*4242/i)).toBeVisible()
  await expect(
    paymentSection.getByText(/saved card is ready for secure confirmation/i),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    paymentSection.locator('iframe[title="Secure payment input frame"]'),
  ).toHaveCount(0)
}
