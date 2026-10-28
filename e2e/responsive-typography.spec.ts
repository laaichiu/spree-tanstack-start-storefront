import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
  { width: 1728, height: 1117 },
] as const

const PUBLIC_PAGES = [
  '/us/en',
  '/us/en/products',
  '/us/en/brands',
  '/us/en/policies/shipping-policy',
  '/us/en/cart',
  '/us/en/account/login',
] as const

async function gotoPage(page: Page, pathname: string) {
  await page.goto(pathname, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await expect(page.getByRole('main')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

async function expectPageTypography(
  page: Page,
  width: number,
  titleRole: 'page' | 'product' = 'page',
) {
  const heading = page
    .getByRole('heading', { level: 1 })
    .filter({ visible: true })
  await expect(heading).toHaveCount(1)
  const isProductTitle = titleRole === 'product'
  await expect(heading).toHaveCSS(
    'font-size',
    isProductTitle
      ? width < 768
        ? '14px'
        : '16px'
      : width < 768
        ? '24px'
        : '30px',
  )
  await expect(heading).toHaveCSS(
    'line-height',
    isProductTitle
      ? width < 768
        ? '17.5px'
        : '20px'
      : width < 768
        ? '30px'
        : '37.5px',
  )
  await expect(page.locator('body')).toHaveCSS('font-size', '12px')
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

async function expectProductHeadingColumns(page: Page) {
  const title = page
    .getByRole('heading', { level: 1 })
    .filter({ visible: true })
  const row = title.locator('..')
  const price = row.locator(':scope > span')
  const titleBounds = await title.boundingBox()
  const priceBounds = await price.boundingBox()
  const rowBounds = await row.boundingBox()
  expect(titleBounds).not.toBeNull()
  expect(priceBounds).not.toBeNull()
  expect(rowBounds).not.toBeNull()
  if (!titleBounds || !priceBounds || !rowBounds) {
    throw new Error('The title and price columns must be visible.')
  }
  const gap = await row.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).columnGap),
  )
  // The title spans three equal tracks and their two internal gaps.
  expect(
    Math.abs(titleBounds.width - priceBounds.width * 3 - gap * 2),
  ).toBeLessThan(1)
  expect(gap).toBe(8)
  await expect(row).toHaveCSS('align-items', 'baseline')
  const baselines = await row.evaluate((element) => {
    const titleElement = element.querySelector('h1')
    const priceLabel = element.querySelector(':scope > span > span')
    if (!titleElement || !priceLabel) {
      throw new Error('The title and current price text must be present.')
    }
    function firstTextBaseline(target: Element) {
      // A zero-size inline marker sits on the first text baseline, independent
      // of font size and line height. Remove it before returning to the page.
      const marker = document.createElement('span')
      marker.style.cssText =
        'display:inline-block;width:0;height:0;vertical-align:baseline'
      target.insertBefore(marker, target.firstChild)
      const baseline = marker.getBoundingClientRect().top
      marker.remove()
      return baseline
    }
    return {
      title: firstTextBaseline(titleElement),
      price: firstTextBaseline(priceLabel),
    }
  })
  expect(Math.abs(baselines.title - baselines.price)).toBeLessThan(1)
  expect(titleBounds.x + titleBounds.width).toBeLessThan(priceBounds.x)
  expect(priceBounds.x + priceBounds.width).toBeLessThanOrEqual(
    rowBounds.x + rowBounds.width + 1,
  )
  await expect(price).toHaveCSS('font-size', '14px')
  await expect(price).toHaveCSS('text-align', 'right')
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'spree_newsletter_popup_dismissed_at_v1',
      new Date().toISOString(),
    )
  })
})

for (const viewport of VIEWPORTS) {
  test(`${viewport.width}px public pages share type roles without overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const pathname of PUBLIC_PAGES) {
      await gotoPage(page, pathname)
      await expectPageTypography(page, viewport.width)

      if (pathname === '/us/en') {
        await expect(
          page.getByRole('heading', { name: 'New In', exact: true }),
        ).toHaveCSS('font-size', viewport.width < 768 ? '18px' : '20px')
        await expect(page.locator('main p').first()).toHaveCSS(
          'font-size',
          '12px',
        )
        // The deferred footer form has its own compact input role.
        await page.locator('footer h2').last().scrollIntoViewIfNeeded()
        await expect(page.locator('#footer-newsletter-email')).toBeVisible()
        await expect(page.locator('#footer-newsletter-email')).toHaveCSS(
          'font-size',
          '14px',
        )
      }

      if (pathname === '/us/en/products') {
        const productLink = page.getByRole('link', { name: /^View / }).first()
        await expect(productLink).toBeVisible()
        const productHref = await productLink.getAttribute('href')
        expect(productHref).toMatch(/^\/us\/en\/products\/[^/?]+/)
        if (!productHref) throw new Error('A product URL is required.')
        await expect(page.locator('main article h3').first()).toHaveCSS(
          'font-size',
          '12px',
        )
        await gotoPage(page, productHref)
        await expectPageTypography(page, viewport.width, 'product')
        await expectProductHeadingColumns(page)
        await expect(
          page.getByRole('button', { name: /add to cart/i }),
        ).toBeVisible()
        const richDescription = page.locator(
          '#product-detail-description .prose',
        )
        if (await richDescription.count()) {
          await expect(richDescription).toHaveCSS('font-size', '12px')
          for (const paragraph of await richDescription.locator('p').all()) {
            await expect(paragraph).toHaveCSS('font-size', '12px')
          }
        }
      }

      if (pathname === '/us/en/policies/shipping-policy') {
        await expect(page.locator('main section p').last()).toHaveCSS(
          'font-size',
          '12px',
        )
      }

      if (pathname === '/us/en/account/login') {
        await expect(page.getByRole('button', { name: /sign in/i })).toHaveCSS(
          'font-size',
          '12px',
        )
        for (const label of await page.locator('main form label').all()) {
          await expect(label).toHaveCSS('font-size', '12px')
        }
        for (const input of await page
          .locator('main input')
          .filter({ visible: true })
          .all()) {
          await expect(input).toHaveCSS('font-size', '16px')
        }
      }
    }
  })
}

test('long product names wrap without moving or resizing the price column', async ({
  page,
}) => {
  await gotoPage(page, '/us/en/products')
  const productHref = await page
    .getByRole('link', { name: /^View / })
    .first()
    .getAttribute('href')
  if (!productHref) throw new Error('A product URL is required.')
  await gotoPage(page, productHref)
  // Synthetic display text exercises both heading copies without backend writes.
  await page.locator('main h1').evaluateAll((headings) => {
    for (const heading of headings) {
      heading.textContent =
        'UltralangesProduktmodellMitMehrsprachigerBeschreibungOhneLeerzeichen'.repeat(
          3,
        )
    }
  })
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 667, height: 375 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 1000 },
    { width: 1728, height: 1117 },
  ]) {
    await page.setViewportSize(viewport)
    await expectPageTypography(page, viewport.width, 'product')
    await expectProductHeadingColumns(page)
    const title = page
      .getByRole('heading', { level: 1 })
      .filter({ visible: true })
    expect(
      await title.evaluate(
        (element) =>
          element.getBoundingClientRect().height >
          Number.parseFloat(getComputedStyle(element).lineHeight) * 1.5,
      ),
    ).toBe(true)
  }
})

test('title roles change only at md and long translated titles wrap', async ({
  page,
}) => {
  await gotoPage(page, '/us/en/account/login')
  // Exercise translation length without requiring a German backend Market.
  await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
    heading.textContent =
      'Melden Sie sich bei Ihrem Kundenkonto an, um Ihre Bestellungen und Lieferadressen zu verwalten'
  })
  for (const width of [320, 639, 640, 767, 768]) {
    await page.setViewportSize({ width, height: 844 })
    await expectPageTypography(page, width)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  }
})
