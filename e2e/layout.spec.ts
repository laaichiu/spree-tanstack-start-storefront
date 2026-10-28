import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const NEWSLETTER_POPUP_DISMISSED_KEY = 'spree_newsletter_popup_dismissed_at_v1'
const STOREFRONT_VIEWPORTS = [
  { height: 568, name: 'small mobile', width: 320 },
  { height: 844, name: 'mobile', width: 390 },
  { height: 375, name: 'small phone landscape', width: 667 },
  { height: 1024, name: 'tablet', width: 768 },
  { height: 390, name: 'large phone landscape', width: 844 },
  { height: 768, name: 'compact desktop width', width: 1024 },
  { height: 800, name: 'desktop navigation threshold', width: 1280 },
  { height: 1000, name: 'desktop', width: 1440 },
  { height: 1117, name: 'wide desktop', width: 1728 },
] as const

async function gotoStorefront(page: Page) {
  await gotoStorefrontPage(page, '/us/en')
}

async function gotoStorefrontPage(page: Page, pathname: string) {
  await page.goto(pathname, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await expect(page.getByRole('main')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
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

test('listing toolbar releases vertical space in phone landscape', async ({
  page,
}) => {
  await page.setViewportSize({ height: 390, width: 844 })
  await gotoStorefrontPage(page, '/us/en/products')

  const toolbar = page.locator('[data-product-listing-toolbar]')
  await expect(toolbar).toHaveCSS('position', 'static')

  await page.setViewportSize({ height: 844, width: 390 })
  await expect(toolbar).toHaveCSS('position', 'sticky')

  await page.setViewportSize({ height: 390, width: 1024 })
  await expect(toolbar).toHaveCSS('position', 'static')
})

test('navigation changes at the width where its links fit', async ({
  page,
}) => {
  await page.setViewportSize({ height: 768, width: 1024 })
  await gotoStorefront(page)

  await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Categories' }),
  ).toBeHidden()

  await page.setViewportSize({ height: 800, width: 1280 })

  const categoryNavigation = page.getByRole('navigation', {
    name: 'Categories',
  })
  const brand = page.getByRole('link', { name: 'Shop home' })
  await expect(categoryNavigation).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()

  const lastLink = categoryNavigation.getByRole('link').last()
  const lastLinkBounds = await lastLink.boundingBox()
  const brandBounds = await brand.boundingBox()
  expect(lastLinkBounds).not.toBeNull()
  expect(brandBounds).not.toBeNull()
  expect(lastLinkBounds!.x + lastLinkBounds!.width + 16).toBeLessThanOrEqual(
    brandBounds!.x,
  )
})

test('short desktop mega menu stays inside the viewport and scrolls', async ({
  page,
}) => {
  await page.setViewportSize({ height: 320, width: 1280 })
  await gotoStorefront(page)

  await page
    .getByRole('navigation', { name: 'Categories' })
    .getByRole('link', { name: 'Kitchen', exact: true })
    .hover()

  const panel = page.getByRole('region', { name: 'Kitchen' })
  await expect(panel).toBeVisible()
  const panelBounds = await panel.boundingBox()
  expect(panelBounds).not.toBeNull()
  expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(321)

  await panel
    .getByRole('link', { name: 'Food Processors' })
    .scrollIntoViewIfNeeded()
  await expect(
    panel.getByRole('link', { name: 'Food Processors' }),
  ).toBeInViewport()
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

    if (viewport.width >= 1280) {
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

const AUXILIARY_SURFACES = [
  {
    heading: 'Your bag is empty',
    name: 'cart',
    pathname: '/us/en/cart',
  },
  {
    heading: 'Sign in',
    name: 'account login',
    pathname: '/us/en/account/login?redirect=%2Fus%2Fen%2Faccount',
  },
] as const

for (const viewport of STOREFRONT_VIEWPORTS) {
  for (const surface of AUXILIARY_SURFACES) {
    test(`${viewport.name} ${surface.name} surface fits without horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await gotoStorefrontPage(page, surface.pathname)

      await expect(page.getByRole('banner')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: surface.heading }),
      ).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  }
}
