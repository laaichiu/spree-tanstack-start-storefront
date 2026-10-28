import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Sheet } from '@/components/ui/sheet'
import { ProductListingFilterDrawerView } from './product-listing-filter-drawer-view'

afterEach(cleanup)

describe('ProductListingFilterDrawerView', () => {
  it('renders sections and preserves the clear/apply actions', () => {
    const clear = vi.fn()
    const apply = vi.fn()

    render(
      <Sheet onOpenChange={vi.fn()} open>
        <ProductListingFilterDrawerView
          actions={{ apply, clear }}
          canClear
          clearAllLabel="Clear all"
          closeLabel="Close filters"
          sections={<div>Filter sections</div>}
          showResultsLabel="Show results"
          title="Filter and sort"
        />
      </Sheet>,
    )

    expect(
      screen.getByRole('heading', { name: 'Filter and sort' }),
    ).toBeTruthy()
    expect(screen.getByText('Filter sections')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show results' }))

    expect(clear).toHaveBeenCalledOnce()
    expect(apply).toHaveBeenCalledOnce()
  })
})
