import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SearchSuggestedItemsView } from './search-suggested-items-view'

afterEach(cleanup)

describe('SearchSuggestedItemsView', () => {
  it('renders the product cards passed to the view', () => {
    render(
      <SearchSuggestedItemsView
        actions={{
          captureClick: vi.fn(),
          dragStart: vi.fn(),
          mouseDownCapture: vi.fn(),
          retry: vi.fn(),
          scrollerRef: vi.fn(),
          selectPage: vi.fn(),
        }}
        model={{
          indicator: {
            activePage: 0,
            hasOverflow: false,
            pageCount: 1,
            progress: 0,
            thumbWidthPercent: 100,
          },
          labels: {
            empty: 'No suggestions',
            page: 'Suggested products',
            retry: 'Retry',
            section: 'Suggested products',
            unavailable: 'Suggestions unavailable',
          },
          status: 'ready',
        }}
        productCards={<button type="button">Suggested product</button>}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Suggested product' }),
    ).toBeTruthy()
  })
})
