import type { ComponentProps } from 'react'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import type { MessageKey } from '@/lib/i18n/messages'

import { MobileNavPanels } from './mobile-nav-panels'

vi.mock('@/components/layout/market-selector', () => ({
  MarketSelector: () => <button type="button">Region and language</button>,
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    params,
    to,
    search: _search,
    preload: _preload,
    onClick,
    ...props
  }: ComponentProps<'a'> & {
    params: { country: string; locale: string; slug?: string }
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
          : to.endsWith('/brands')
            ? '/brands'
            : '/account')
      }
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
    />
  ),
}))

afterEach(cleanup)

const apple = {
  id: 'sel_apple',
  imageUrl: '/brand-cover.webp',
  name: 'Apple',
  slug: 'apple',
}
const brands: BrandNavigation = {
  enabled: true,
  featuredBrand: apple,
  items: [apple],
}
const messages: Partial<Record<MessageKey, string>> = {
  'brand.directory': 'Brands',
  'brand.featuredBrands': 'Featured Brands',
  'brand.viewAllBrands': 'All Brands',
  'header.back': 'Back',
  'header.categories': 'Categories',
  'header.myAccount': 'My account',
  'home.shop': 'Shop',
}
const t = (key: MessageKey) => messages[key] ?? key

describe('MobileNavPanels Brands', () => {
  it('opens Brands as a nested panel', () => {
    const actions = { close: vi.fn(), popPanel: vi.fn(), pushPanel: vi.fn() }
    render(
      <MobileNavPanels
        actions={actions}
        animatedIndex={0}
        brands={brands}
        categories={[]}
        isPopping={false}
        marketParams={{ country: 'us', locale: 'en' }}
        panelStack={[{ kind: 'main' }]}
        t={t}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Brands' }))
    expect(actions.pushPanel).toHaveBeenCalledWith({ kind: 'brands' })
    expect(actions.close).not.toHaveBeenCalled()
  })

  it('shows Brands in the back bar and Featured Brands above the brand links', () => {
    const actions = { close: vi.fn(), popPanel: vi.fn(), pushPanel: vi.fn() }
    render(
      <MobileNavPanels
        actions={actions}
        animatedIndex={1}
        brands={brands}
        categories={[]}
        isPopping={false}
        marketParams={{ country: 'us', locale: 'en' }}
        panelStack={[{ kind: 'main' }, { kind: 'brands' }]}
        t={t}
      />,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Featured Brands',
    })
    expect(screen.getByText('Brands')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Featured Brands' })).toBeTruthy()
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['All Brands', 'Apple'])
    expect(screen.getByRole('img', { name: 'Apple' }).getAttribute('src')).toBe(
      '/brand-cover.webp',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(actions.popPanel).toHaveBeenCalledTimes(1)
    fireEvent.click(
      within(navigation).getByRole('link', { name: 'All Brands' }),
    )
    expect(actions.close).toHaveBeenCalledTimes(1)
  })
})
