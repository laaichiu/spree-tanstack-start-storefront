import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const NEWSLETTER_POPUP_DISMISSED_KEY = 'spree_newsletter_popup_dismissed_at_v1'

async function gotoStorefrontRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('main')).toBeVisible()
  await page.waitForLoadState('load')
}

async function getFirstProductHref(page: Page) {
  const productLink = page.locator('a[href^="/us/en/products/"]').first()

  await expect(productLink).toBeVisible({ timeout: 15_000 })

  const href = await productLink.getAttribute('href')
  if (!href) {
    throw new Error('Expected a product link href')
  }

  return href
}

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  expect(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ html, target }) => ({ html, target })),
    })),
  ).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, new Date().toISOString())
  }, NEWSLETTER_POPUP_DISMISSED_KEY)
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('home page has no WCAG 2A/2AA violations', async ({ page }) => {
  await gotoStorefrontRoute(page, '/us/en')
  await expectNoAccessibilityViolations(page)
})

test('product listing page has no WCAG 2A/2AA violations', async ({ page }) => {
  await gotoStorefrontRoute(page, '/us/en/products')
  await expectNoAccessibilityViolations(page)
})

test('product detail page has no WCAG 2A/2AA violations', async ({ page }) => {
  await gotoStorefrontRoute(page, '/us/en/products')
  await page.goto(await getFirstProductHref(page), {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: 15_000,
  })
  await expectNoAccessibilityViolations(page)
})

test('login page has no WCAG 2A/2AA violations', async ({ page }) => {
  await gotoStorefrontRoute(page, '/us/en/account/login')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
})
