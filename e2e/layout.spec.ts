import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const NEWSLETTER_POPUP_DISMISSED_KEY = 'spree_newsletter_popup_dismissed_at'
const STOREFRONT_VIEWPORTS = [
  { height: 844, name: 'mobile', width: 390 },
  { height: 1024, name: 'tablet', width: 768 },
  { height: 1000, name: 'desktop', width: 1440 },
  { height: 1117, name: 'wide desktop', width: 1728 },
] as const

async function gotoStorefront(page: Page) {
  await page.goto('/us/en', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await page.waitForTimeout(750)
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, new Date().toISOString())
  }, NEWSLETTER_POPUP_DISMISSED_KEY)
})

test('desktop mega menu opens on hover and restores focus on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ height: 1000, width: 1440 })
  await gotoStorefront(page)

  const categoryNavigation = page.getByRole('navigation', {
    name: 'Categories',
  })
  const kitchenLink = categoryNavigation.getByRole('link', {
    exact: true,
    name: 'Kitchen',
  })

  await expect(kitchenLink).toBeVisible()
  await kitchenLink.hover()

  const kitchenPanel = page.getByRole('region', { name: 'Kitchen' })

  await expect(kitchenPanel).toBeVisible()
  await expect(
    kitchenPanel.getByRole('link', { name: 'All Kitchen', exact: true }),
  ).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(kitchenPanel).toBeHidden()
  await expect(kitchenLink).toBeFocused()
})

test('desktop drawers isolate the page and restore their trigger focus', async ({
  page,
}) => {
  await page.setViewportSize({ height: 1000, width: 1440 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoStorefront(page)

  const main = page.locator('main')
  const searchButton = page.getByRole('button', { name: 'Search products' })

  await searchButton.hover()
  await page.waitForLoadState('networkidle')
  await searchButton.click()

  const searchDialog = page.getByRole('dialog', { name: 'Search' })
  await expect(searchDialog).toBeVisible({ timeout: 15_000 })
  await expect(
    searchDialog.getByRole('textbox', { name: 'Search' }),
  ).toBeFocused()
  await expect(main).toHaveAttribute('aria-hidden', 'true')

  await page.keyboard.press('Escape')

  await expect(searchDialog).toBeHidden()
  await expect(main).not.toHaveAttribute('aria-hidden', 'true')
  await expect(searchButton).toBeFocused()

  const cartButton = page.getByRole('button', { name: 'View cart' })
  await cartButton.click()

  const cartDialog = page.getByRole('dialog', { name: /Your Bag/ })
  await expect(cartDialog).toBeVisible()
  await expect(main).toHaveAttribute('aria-hidden', 'true')

  await page.keyboard.press('Escape')

  await expect(cartDialog).toBeHidden()
  await expect(main).not.toHaveAttribute('aria-hidden', 'true')
  await expect(cartButton).toBeFocused()
})

test('mobile navigation traps focus and restores it on close', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await gotoStorefront(page)

  const main = page.locator('main')
  const menuButton = page.getByRole('button', { name: 'Open menu' })
  await menuButton.click()

  const menuDialog = page.getByRole('dialog', { name: 'Menu' })
  await expect(menuDialog).toBeVisible()
  await expect(main).toHaveAttribute('aria-hidden', 'true')
  await expect(
    menuDialog.getByRole('button', { name: 'Kitchen' }),
  ).toBeVisible()
  await expect
    .poll(() =>
      menuDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
    )
    .toBe(true)
  await expectNoHorizontalOverflow(page)

  await page.keyboard.press('Escape')

  await expect(menuDialog).toBeHidden()
  await expect(main).not.toHaveAttribute('aria-hidden', 'true')
  await expect(menuButton).toBeFocused()
})

for (const viewport of STOREFRONT_VIEWPORTS) {
  test(`${viewport.name} storefront shell and catalog fit without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await gotoStorefront(page)

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    if (viewport.width >= 1024) {
      await expect(
        page.getByRole('navigation', { name: 'Categories' }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()
    } else {
      await expect(
        page.getByRole('button', { name: 'Open menu' }),
      ).toBeVisible()
      await expect(
        page.getByRole('navigation', { name: 'Categories' }),
      ).toBeHidden()
    }

    await page.goto('/us/en/products')

    const firstProductLink = page.getByRole('link', { name: /^View / }).first()
    await expect(firstProductLink).toBeVisible({ timeout: 15_000 })
    await expectNoHorizontalOverflow(page)

    const firstProductHref = await firstProductLink.getAttribute('href')
    expect(firstProductHref).toMatch(/^\/us\/en\/products\/[^/?]+/)

    if (!firstProductHref) {
      throw new Error('The first product link is missing its href.')
    }

    await page.goto(firstProductHref)

    await expect(page).toHaveURL(/\/us\/en\/products\/[^/?]+/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /add to cart/i }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
}
