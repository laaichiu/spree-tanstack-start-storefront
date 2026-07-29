import { readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '@/components/home/home-page'
import { MarketProvider } from '@/components/layout/market-provider'
import type { HomePageModel } from '@/lib/catalog/model/home-page'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    'aria-label': ariaLabel,
    children,
    className,
  }: {
    'aria-label'?: string
    children: ReactNode
    className?: string
  }) => (
    <a aria-label={ariaLabel} className={className} href="/fixture-link">
      {children}
    </a>
  ),
}))

const page: HomePageModel = {
  featuredCategories: {
    categories: [
      {
        id: 'category-kitchen',
        imageUrl: null,
        name: 'Kitchen',
        permalink: 'kitchen',
      },
    ],
    status: 'ready',
  },
  featuredProducts: {
    products: [
      {
        defaultVariantId: null,
        description: 'A useful mug.',
        id: 'product-mug',
        image: null,
        inStock: true,
        preorder: false,
        name: 'Everyday Mug',
        price: { amount: 12, currencyCode: 'USD' },
        slug: 'everyday-mug',
        variants: [],
      },
    ],
    status: 'ready',
  },
}

function renderHome(model: HomePageModel) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <HomePage page={model} />
    </MarketProvider>,
  )
}

afterEach(cleanup)

describe('HomePage', () => {
  it('composes theme-owned sections from one normalized page contract', () => {
    renderHome(page)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Shaped by sunlight' }),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'New In' })).toBeTruthy()
    expect(
      screen.getAllByRole('link', { name: 'View Everyday Mug' }),
    ).toHaveLength(2)
    expect(
      screen.getByRole('heading', { name: 'Featured Categories' }),
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Kitchen' })).toBeTruthy()
  })

  it('renders stable empty and error states without changing page composition', () => {
    renderHome({
      featuredCategories: { categories: [], status: 'error' },
      featuredProducts: { products: [], status: 'empty' },
    })

    expect(screen.getByText('No new products yet')).toBeTruthy()
    expect(
      screen.getByText('Featured categories could not be loaded'),
    ).toBeTruthy()
  })

  it('keeps the page composition outside commerce infrastructure boundaries', () => {
    const source = readFileSync('src/components/home/home-page.tsx', 'utf8')

    expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
    expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
    expect(source).not.toMatch(/\.server(?:'|")/)
  })
})
