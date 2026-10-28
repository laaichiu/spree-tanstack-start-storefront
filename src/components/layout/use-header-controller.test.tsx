import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import type { StorefrontShellCapabilities } from '@/lib/storefront/contracts'
import {
  FALLBACK_STOREFRONT_MARKETS,
  resolveMarketSelection,
} from '@/lib/market/utils/market'

import { useHeaderController } from './use-header-controller'

vi.mock('@/lib/cart/client/use-cart-query', () => ({
  useCart: () => ({ data: null }),
}))
vi.mock('./market-provider', () => ({
  useMarket: () => ({
    market: resolveMarketSelection(FALLBACK_STOREFRONT_MARKETS, {
      country: 'us',
      locale: 'en',
    }).market,
    t: (key: string) => key,
  }),
}))

afterEach(cleanup)

function capabilities(
  categories: CategoryNavigationItem[],
): StorefrontShellCapabilities {
  return {
    brands: { enabled: false, featuredBrand: null, items: [] },
    cart: {
      freeShippingPromotion: null,
      initialCart: null,
      initialLoadError: null,
    },
    navigation: { categories },
  }
}

function category(id: string): CategoryNavigationItem {
  return { id, name: id, permalink: id, imageUrl: null, children: [] }
}

describe('header navigation data ownership', () => {
  it('passes the backend order unchanged to both menus', () => {
    const categories = [category('ctg_z'), category('ctg_a')]
    const { result } = renderHook(() =>
      useHeaderController({
        capabilities: capabilities(categories),
        onPreloadCart: vi.fn(),
        onPreloadSearch: vi.fn(),
      }),
    )
    expect(result.current.categories).toBe(categories)
    expect(result.current.categories.map(({ id }) => id)).toEqual([
      'ctg_z',
      'ctg_a',
    ])
  })

  it('does not replace empty backend navigation with local configuration', () => {
    const { result } = renderHook(() =>
      useHeaderController({
        capabilities: capabilities([]),
        onPreloadCart: vi.fn(),
        onPreloadSearch: vi.fn(),
      }),
    )
    expect(result.current.categories).toEqual([])
  })

  it('replaces navigation when new shell capabilities arrive', () => {
    const initial = capabilities([category('ctg_old')])
    const { result, rerender } = renderHook(
      ({ shell }) =>
        useHeaderController({
          capabilities: shell,
          onPreloadCart: vi.fn(),
          onPreloadSearch: vi.fn(),
        }),
      { initialProps: { shell: initial } },
    )
    rerender({ shell: capabilities([]) })
    expect(result.current.categories).toEqual([])
    const updated = [category('ctg_new')]
    rerender({ shell: capabilities(updated) })
    expect(result.current.categories).toBe(updated)
  })
})
