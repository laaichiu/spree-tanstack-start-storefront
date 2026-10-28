import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import type { CatalogCategoryReference } from '@/lib/catalog/contracts'
import { HomeFeaturedCategoriesView } from './home-featured-categories-view'

afterEach(cleanup)

const labels = {
  emptyDescription: 'New collections are on the way.',
  emptyTitle: 'No collections yet',
  errorDescription: 'Try again in a moment.',
  errorTitle: 'Collections are unavailable',
  shopAll: 'Shop all',
  title: 'Featured collections',
}

const categories: CatalogCategoryReference[] = [
  {
    id: 'category-1',
    imageUrl: '/summer.jpg',
    name: 'Summer',
    permalink: 'collections/summer',
  },
]

function renderCategoryLink(
  category: CatalogCategoryReference,
  content: ReactNode,
  className?: string,
) {
  return (
    <a className={className} href={`/${category.permalink}`}>
      {content}
    </a>
  )
}

describe('HomeFeaturedCategoriesView', () => {
  it('presents ready, empty and error category states', () => {
    const { rerender } = render(
      <HomeFeaturedCategoriesView
        categories={categories}
        labels={labels}
        renderCategoryLink={renderCategoryLink}
        status="ready"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Featured collections' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('img', { name: 'Summer' }).getAttribute('src'),
    ).toBe('/summer.jpg')
    expect(
      screen.getByRole('link', { name: /Summer Shop all/ }),
    ).toHaveProperty('pathname', '/collections/summer')

    rerender(
      <HomeFeaturedCategoriesView
        categories={[]}
        labels={labels}
        renderCategoryLink={renderCategoryLink}
        status="empty"
      />,
    )
    expect(screen.getByText('No collections yet')).toBeTruthy()
    expect(screen.getByText('New collections are on the way.')).toBeTruthy()

    rerender(
      <HomeFeaturedCategoriesView
        categories={[]}
        labels={labels}
        renderCategoryLink={renderCategoryLink}
        status="error"
      />,
    )
    expect(screen.getByText('Collections are unavailable')).toBeTruthy()
    expect(screen.getByText('Try again in a moment.')).toBeTruthy()
  })
})
