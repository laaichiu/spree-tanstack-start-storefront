import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import { HAS_SPREE_DEMO_PATH, runSpreeDemoScript } from './spree-demo'

const E2E_DISCOUNT_PROMOTION_CODE =
  process.env.E2E_DISCOUNT_CODE?.trim() || '10off'
const CONFIGURED_E2E_GIFT_CARD_CODE =
  process.env.E2E_GIFT_CARD_CODE?.trim() || null
const LOCAL_E2E_GIFT_CARD_CODE = 'e2e-gift-card-50'

export function createE2EDiscountCode() {
  const code = `e2e-${Date.now()}-${randomUUID().slice(0, 8)}`
  const script = `
promotion = Spree::Promotion.find_by(code: ENV.fetch("E2E_PROMOTION_CODE"))
raise "E2E discount promotion was not found." unless promotion
store = Spree::Store.default || Spree::Store.first
raise "E2E storefront store was not found." unless store
promotion.update_column(:store_id, store.id) unless promotion.store_id == store.id
coupon_code = Spree::CouponCode.create!(
  code: ENV.fetch("E2E_COUPON_CODE"),
  promotion: promotion,
  state: "unused"
)
puts coupon_code.code
`

  return runSpreeDemoScript(script, {
    E2E_COUPON_CODE: code,
    E2E_PROMOTION_CODE: E2E_DISCOUNT_PROMOTION_CODE,
  })
}

export function provisionE2EGiftCardCode() {
  if (CONFIGURED_E2E_GIFT_CARD_CODE) {
    return CONFIGURED_E2E_GIFT_CARD_CODE
  }

  if (!HAS_SPREE_DEMO_PATH) {
    return null
  }

  const script = `
store = Spree::Store.default || Spree::Store.first
raise "E2E storefront store was not found." unless store
gift_card = Spree::GiftCard.find_or_initialize_by(
  store: store,
  code: ENV.fetch("E2E_GIFT_CARD_CODE")
)
gift_card.assign_attributes(
  amount: 50,
  amount_authorized: 0,
  amount_used: 0,
  currency: store.default_currency,
  expires_at: 1.year.from_now.to_date,
  redeemed_at: nil,
  state: "active",
  user: nil
)
gift_card.save!
puts gift_card.code
`

  runSpreeDemoScript(script, {
    E2E_GIFT_CARD_CODE: LOCAL_E2E_GIFT_CARD_CODE,
  })

  return LOCAL_E2E_GIFT_CARD_CODE
}

export async function applyCheckoutDiscountCode(page: Page, code: string) {
  const checkoutCode = page.getByRole('textbox', {
    name: /discount code or gift card/i,
  })
  await checkoutCode.fill(code)
  await page.getByRole('button', { name: /^apply$/i }).click()

  await expect(
    page.getByRole('status').filter({ hasText: /discount code applied/i }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(checkoutCode).toHaveValue('')
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page).toHaveURL(/\/checkout\//)
}

export async function applyCheckoutGiftCardCode(page: Page, code: string) {
  const checkoutCode = page.getByRole('textbox', {
    name: /discount code or gift card/i,
  })
  await checkoutCode.fill(code)
  await page.getByRole('button', { name: /^apply$/i }).click()

  await expect(
    page.getByRole('status').filter({ hasText: /gift card applied/i }),
  ).toBeVisible({ timeout: 30_000 })
  await expect(checkoutCode).toHaveValue('')
  await expect(page.getByRole('alert')).toBeHidden()
  await expect(page).toHaveURL(/\/checkout\//)
}

export function getCheckoutSummary(page: Page) {
  return page
    .locator('aside')
    .filter({ hasText: /order summary/i })
    .first()
}

export async function getCheckoutSummaryTotal(page: Page) {
  return getCheckoutSummaryValue(page, /^total$/i)
}

export async function getCheckoutSummaryAmountDue(page: Page) {
  return getCheckoutSummaryValue(page, /^amount due$/i)
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getCheckoutSummaryValue(page: Page, label: RegExp) {
  const summaryText = await getCheckoutSummary(page).innerText()
  const summaryLines = summaryText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const totalIndex = summaryLines.findIndex((line) => label.test(line))

  if (totalIndex < 0) {
    throw new Error(`Checkout summary value was not found:\n${summaryText}`)
  }

  return summaryLines.slice(totalIndex, totalIndex + 3).join(' ')
}
