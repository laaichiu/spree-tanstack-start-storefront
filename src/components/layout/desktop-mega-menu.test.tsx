import type { ComponentProps } from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { fallbackMessages } from '@/lib/i18n/messages'
import {
  resolveMarketSelection,
  FALLBACK_STOREFRONT_MARKETS,
} from '@/lib/market/utils/market'

import { DesktopMegaMenu } from './desktop-mega-menu'
import { MarketProvider } from './market-provider'

vi.mock('@tanstack/react-router', () => ({
  useLocation: ({
    select,
  }: {
    select: (location: { pathname: string }) => string
  }) => select({ pathname: '/us/en' }),
  Link: ({
    params,
    to,
    search: _search,
    preload: _preload,
    onClick,
    ...props
  }: ComponentProps<'a'> & {
    params: { country: string; locale: string; slug?: string; _splat?: string }
    to: string
    search?: unknown
    preload?: boolean
  }) => (
    <a
      {...props}
      href={
        '/' +
        params.country +
        '/' +
        params.locale +
        (params.slug
          ? '/' + params.slug
          : params._splat
            ? '/collections/' + params._splat
            : to.endsWith('/brands')
              ? '/brands'
              : '')
      }
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
    />
  ),
}))

const apple = {
  id: 'sel_apple',
  name: 'Apple',
  slug: 'apple',
  imageUrl: '/cover.webp',
}
const brands: BrandNavigation = {
  enabled: true,
  featuredBrand: apple,
  items: [
    apple,
    { id: 'sel_beta', name: 'Beta', slug: 'beta', imageUrl: null },
  ],
}
const categories: CategoryNavigationItem[] = [
  {
    id: 'ctg_kitchen',
    name: 'Kitchen',
    permalink: 'kitchen',
    imageUrl: null,
    children: [
      {
        id: 'ctg_kettles',
        name: 'Kettles',
        permalink: 'kitchen/kettles',
        imageUrl: null,
        children: [],
      },
    ],
  },
]
const market = resolveMarketSelection(FALLBACK_STOREFRONT_MARKETS, {
  country: 'us',
  locale: 'en',
}).market
const media = { matches: true, listeners: new Set<() => void>() }

beforeEach(() => {
  media.matches = true
  media.listeners.clear()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return media.matches
    },
    addEventListener: (_type: string, listener: () => void) =>
      media.listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      media.listeners.delete(listener),
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function Menu({ navigation = brands }: { navigation?: BrandNavigation }) {
  return (
    <MarketProvider
      market={market}
      marketOptions={FALLBACK_STOREFRONT_MARKETS}
      messages={fallbackMessages}
    >
      <DesktopMegaMenu brands={navigation} categories={categories} />
    </MarketProvider>
  )
}

describe('DesktopMegaMenu Brands', () => {
  it('opens the shared menu with All Brands first, curated links, and the configured image', async () => {
    render(<Menu />)
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Brands' }))
    const panel = await screen.findByRole('region', { name: 'Featured Brands' })
    const list = within(panel).getByRole('navigation', {
      name: 'Featured Brands',
    })

    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['All Brands', 'Apple', 'Beta'])
    expect(
      within(list)
        .getByRole('link', { name: 'All Brands' })
        .getAttribute('href'),
    ).toBe('/us/en/brands')
    expect(
      within(panel).getByRole('img', { name: 'Apple' }).getAttribute('src'),
    ).toBe('/cover.webp')
    expect(
      within(panel)
        .getByRole('link', { name: 'Apple Shop Apple' })
        .getAttribute('href'),
    ).toBe('/us/en/apple')
    fireEvent.click(within(list).getByRole('link', { name: 'Beta' }))
    expect(screen.queryByRole('region', { name: 'Featured Brands' })).toBeNull()
  })

  it('supports ArrowDown into the panel and Escape back to the Brands trigger', async () => {
    render(<Menu />)
    const trigger = screen.getByRole('link', { name: 'Brands' })
    act(() => trigger.focus())
    const panel = await screen.findByRole('region', { name: 'Featured Brands' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(within(panel).getByRole('link', { name: 'All Brands' })).toBe(
      document.activeElement,
    )
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: 'Escape',
    })
    expect(screen.queryByRole('region', { name: 'Featured Brands' })).toBeNull()
    expect(trigger).toBe(document.activeElement)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('switches between Brands and category panels without retaining both', async () => {
    render(<Menu />)
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Brands' }))
    await screen.findByRole('region', { name: 'Featured Brands' })
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Kitchen' }))
    const category = await screen.findByRole('region', { name: 'Kitchen' })
    expect(
      within(category).getByRole('link', { name: 'All Kitchen' }),
    ).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Featured Brands' })).toBeNull()
  })

  it('retains the full directory link when no curated images or brands are available', async () => {
    render(
      <Menu navigation={{ enabled: true, featuredBrand: null, items: [] }} />,
    )
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Brands' }))
    const panel = await screen.findByRole('region', { name: 'Featured Brands' })
    expect(within(panel).getByRole('link', { name: 'All Brands' })).toBeTruthy()
    expect(within(panel).queryByRole('img')).toBeNull()
  })

  it('closes its portal when the header switches to mobile navigation', async () => {
    render(<Menu />)
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Brands' }))
    await screen.findByRole('region', { name: 'Featured Brands' })
    act(() => {
      media.matches = false
      media.listeners.forEach((listener) => listener())
    })
    expect(screen.queryByRole('region', { name: 'Featured Brands' })).toBeNull()
  })

  it('hides Brands when no backend brand is available', () => {
    render(
      <Menu navigation={{ enabled: false, featuredBrand: null, items: [] }} />,
    )
    expect(screen.queryByRole('link', { name: 'Brands' })).toBeNull()
  })
})
