// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCartForMarket } from '@/lib/cart/api/cart-read.server'
import { getConfiguredCartFreeShippingPromotion } from '@/lib/cart/config/free-shipping'
import { getNavigationCategoriesForMarket } from '@/lib/catalog/api/get-navigation-categories.server'
import { getStorefrontMarketsForRequest } from '@/lib/market/api/get-storefront-markets.server'
import { getStorefrontBrandingForRequest } from './get-storefront-branding.server'
import {
  isBrowserFetchFailureError,
  reportError,
} from '@/lib/observability/report-error'
import { translateMessage } from '@/lib/i18n/messages'

import { loadStorefrontShellForRequest } from './load-storefront-shell.server'

vi.mock('@/lib/cart/api/cart-read.server', () => ({
  getCartForMarket: vi.fn(),
}))
vi.mock('@/lib/cart/config/free-shipping', () => ({
  getConfiguredCartFreeShippingPromotion: vi.fn(),
}))
vi.mock('@/lib/catalog/api/get-navigation-categories.server', () => ({
  getNavigationCategoriesForMarket: vi.fn(),
}))
vi.mock('@/lib/market/api/get-storefront-markets.server', () => ({
  getStorefrontMarketsForRequest: vi.fn(),
}))
vi.mock('./get-storefront-branding.server', () => ({
  getStorefrontBrandingForRequest: vi.fn(),
}))
vi.mock('@/lib/observability/report-error', () => ({
  isBrowserFetchFailureError: vi.fn(),
  reportError: vi.fn(),
}))
vi.mock('@/lib/i18n/messages', () => ({
  translateMessage: vi.fn(),
}))

const marketOptions = [
  {
    countries: [
      {
        country: 'us',
        countryName: 'United States',
        currencyCode: 'USD',
        locale: 'en',
        marketId: 'market_us',
        marketName: 'United States',
      },
    ],
    currencyCode: 'USD',
    currencyLabel: 'US Dollar',
    defaultCountry: 'us',
    defaultLocale: 'en',
    id: 'market_us',
    isDefault: true,
    locales: [{ code: 'en', label: 'English', shortLabel: 'EN' }],
    name: 'United States',
  },
]

const categories = [
  {
    children: [],
    id: 'category-kitchen',
    imageUrl: null,
    name: 'Kitchen',
    permalink: 'kitchen',
  },
]

const freeShippingPromotion = {
  comparison: 'greaterThan' as const,
  threshold: { amount: 100, currencyCode: 'USD' },
}

const branding = {
  locale: 'en',
  logoUrl: null,
  metaDescription: 'Shop description',
  name: 'Shop',
  seoTitle: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getStorefrontMarketsForRequest).mockResolvedValue(marketOptions)
  vi.mocked(getConfiguredCartFreeShippingPromotion).mockReturnValue(
    freeShippingPromotion,
  )
  vi.mocked(getStorefrontBrandingForRequest).mockResolvedValue(branding)
  vi.mocked(getNavigationCategoriesForMarket).mockResolvedValue(categories)
  vi.mocked(getCartForMarket).mockResolvedValue(null)
  vi.mocked(isBrowserFetchFailureError).mockReturnValue(false)
  vi.mocked(translateMessage).mockReturnValue('Cart unavailable')
})

describe('loadStorefrontShellForRequest', () => {
  it('skips navigation and cart work for checkout shells', async () => {
    const shell = await loadStorefrontShellForRequest({
      country: 'us',
      locale: 'en',
      useCheckoutShell: true,
    })

    expect(getNavigationCategoriesForMarket).not.toHaveBeenCalled()
    expect(getCartForMarket).not.toHaveBeenCalled()
    expect(shell).toEqual({
      branding,
      capabilities: {
        cart: {
          freeShippingPromotion,
          initialCart: null,
          initialLoadError: null,
        },
        navigation: { categories: [] },
      },
      market: expect.objectContaining({
        country: 'us',
        currencyCode: 'USD',
        locale: 'en',
      }),
      marketOptions,
      shouldRedirect: false,
    })
  })

  it('loads navigation and cart with the same verified market', async () => {
    const pendingNavigation = deferred<typeof categories>()
    const pendingCart = deferred<null>()
    let navigationMarket: unknown
    let cartMarket: unknown
    vi.mocked(getNavigationCategoriesForMarket).mockImplementation(
      ({ market }) => {
        navigationMarket = market
        return pendingNavigation.promise
      },
    )
    vi.mocked(getCartForMarket).mockImplementation(async (market) => {
      cartMarket = market
      return pendingCart.promise
    })

    const shellPromise = loadStorefrontShellForRequest({
      country: 'us',
      locale: 'en',
      useCheckoutShell: false,
    })

    await Promise.resolve()
    await Promise.resolve()
    expect(getStorefrontMarketsForRequest).toHaveBeenCalledTimes(1)
    expect(getNavigationCategoriesForMarket).toHaveBeenCalledTimes(1)
    expect(getCartForMarket).toHaveBeenCalledTimes(1)
    expect(navigationMarket).toBe(cartMarket)
    expect(navigationMarket).toEqual(
      expect.objectContaining({
        country: 'us',
        currencyCode: 'USD',
        locale: 'en',
        marketId: 'market_us',
      }),
    )

    pendingNavigation.resolve(categories)
    pendingCart.resolve(null)

    await expect(shellPromise).resolves.toMatchObject({
      capabilities: {
        cart: {
          initialCart: null,
          initialLoadError: null,
        },
        navigation: { categories },
      },
      shouldRedirect: false,
    })
  })

  it('keeps independent fallback and translated error behavior', async () => {
    const navigationError = new Error('navigation unavailable')
    const cartError = new Error('cart unavailable')
    vi.mocked(getNavigationCategoriesForMarket).mockRejectedValue(
      navigationError,
    )
    vi.mocked(getCartForMarket).mockRejectedValue(cartError)

    const shell = await loadStorefrontShellForRequest({
      country: 'us',
      locale: 'en',
      useCheckoutShell: false,
    })

    expect(shell.capabilities.navigation.categories).toEqual([])
    expect(shell.capabilities.cart.initialCart).toBeNull()
    expect(shell.capabilities.cart.initialLoadError).toBe('Cart unavailable')
    expect(reportError).toHaveBeenCalledWith({
      context: 'layout.navigationCategories',
      error: navigationError,
    })
    expect(reportError).toHaveBeenCalledWith({
      context: 'layout.cart',
      error: cartError,
    })
    expect(translateMessage).toHaveBeenCalledWith(
      'en',
      'cart.cartLoadFailedDescription',
    )
  })

  it('preserves redirect semantics without loading shell data', async () => {
    const shell = await loadStorefrontShellForRequest({
      country: 'ca',
      locale: 'en',
      useCheckoutShell: false,
    })

    expect(shell.shouldRedirect).toBe(true)
    expect(shell.market.country).toBe('us')
    expect(getNavigationCategoriesForMarket).not.toHaveBeenCalled()
    expect(getCartForMarket).not.toHaveBeenCalled()
  })
})

function deferred<T>() {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })

  return { promise, resolve: resolvePromise }
}
