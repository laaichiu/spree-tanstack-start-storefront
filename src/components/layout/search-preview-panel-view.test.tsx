import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SearchPreviewPanelView } from './search-preview-panel-view'

afterEach(cleanup)

describe('SearchPreviewPanelView', () => {
  it('delegates search-results navigation while preserving panel slots', () => {
    const onNavigateToSearchResults = vi.fn()

    render(
      <SearchPreviewPanelView
        model={{
          activeSearchHeading: 'Results for "Boots"',
          emptyMessage: 'No products found',
          loadingLabel: 'Searching',
          productCountLabel: '2 products',
          searchResultsLabel: 'View all results',
          status: 'ready',
        }}
        onNavigateToSearchResults={onNavigateToSearchResults}
        slots={{
          categoryLinks: <nav aria-label="Categories">Categories</nav>,
          productRows: <div>Product rows</div>,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'View all results' }))

    expect(onNavigateToSearchResults).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Product rows')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Categories' })).toBeTruthy()
  })
})
