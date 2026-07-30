import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function getFirstProductHref(page: Page) {
  const productLink = page.locator('a[href^="/us/en/products/"]').first()

  await expect(productLink).toBeVisible({ timeout: 15_000 })
  await expect(productLink).toHaveAttribute('href', /\/products\/[^/]+$/)

  const href = await productLink.getAttribute('href')
  if (!href) {
    throw new Error('Expected a product link href')
  }

  return href
}

test('staging exposes robots and sitemap endpoints', async ({ request }) => {
  const robotsResponse = await request.get('/robots.txt')
  expect(robotsResponse.status()).toBe(200)
  expect(robotsResponse.headers()['content-type']).toContain('text/plain')

  const robots = await robotsResponse.text()
  expect(robots).toContain('Sitemap:')
  expect(robots).toContain('Disallow: /*?*q=*')

  const sitemapResponse = await request.get('/sitemap.xml')
  expect(sitemapResponse.status()).toBe(200)
  expect(sitemapResponse.headers()['content-type']).toContain('application/xml')

  const sitemap = await sitemapResponse.text()
  expect(sitemap).toMatch(/<(urlset|sitemapindex)\b/)

  if (sitemap.includes('<sitemapindex')) {
    const shardUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, url]) => url,
    )

    expect(shardUrls.length).toBeGreaterThan(0)

    const shardResponses = await Promise.all(
      shardUrls.map((url) => request.get(url)),
    )

    for (const shardResponse of shardResponses) {
      expect(shardResponse.status()).toBe(200)
      expect(await shardResponse.text()).toContain('<urlset')
    }
  }
})

test('indexable pages expose canonical and alternate metadata', async ({
  page,
}) => {
  const homeResponse = await page.goto('/us/en', {
    waitUntil: 'domcontentloaded',
  })
  expect(homeResponse?.status()).toBe(200)
  await expect(page).toHaveTitle(
    /TanStack Start (Ecommerce|E-Commerce|EC) Storefront.+\|.+/,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/us\/en$/,
  )
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveCount(1)

  await page.goto('/us/en/products', { waitUntil: 'domcontentloaded' })
  await getFirstProductHref(page)

  await page.goto('/us/en/account/login', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveTitle(/Account\s*\|\s*.+/)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  )
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('faceted listings are noindex and PDP/policy contracts remain valid', async ({
  page,
}) => {
  await page.goto('/us/en/products?q=coffee', {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  )

  await page.goto('/us/en/products', { waitUntil: 'domcontentloaded' })
  await page.goto(await getFirstProductHref(page), {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)

  const structuredData = page.locator('script[type="application/ld+json"]')
  expect(await structuredData.count()).toBeGreaterThanOrEqual(1)
  expect(await structuredData.allTextContents()).toContainEqual(
    expect.stringContaining('"@type":"Product"'),
  )

  const unknownPolicyResponse = await page.goto(
    '/us/en/policies/not-a-real-policy',
    { waitUntil: 'domcontentloaded' },
  )
  expect(unknownPolicyResponse?.status()).toBe(404)
})
