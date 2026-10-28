import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Sheet } from '@/components/ui/sheet'
import { ProductListingFilterToolbarView } from './product-listing-filter-toolbar-view'

afterEach(cleanup)

describe('ProductListingFilterToolbarView', () => {
  it('prepares the mobile drawer and forwards desktop filter selection', () => {
    const filterClick = vi.fn()
    const prepareDrawer = vi.fn()

    render(
      <Sheet>
        <ProductListingFilterToolbarView
          actions={{ filterClick, prepareDrawer }}
          appliedFilterCount={2}
          filters={[
            {
              badgeCount: 1,
              id: 'color',
              isActive: true,
              label: 'Color',
            },
          ]}
          hasAppliedFilters
          mobileFilterLabel="Filter"
          slots={{
            activeFilters: <p>Active filters</p>,
            desktopSort: <span>Desktop sort</span>,
            mobileSort: <span>Mobile sort</span>,
          }}
        />
      </Sheet>,
    )

    fireEvent.click(screen.getByRole('button', { name: /filter\s*\(2\)/i }))
    fireEvent.click(screen.getByRole('button', { name: /color\s*\(1\)/i }))

    expect(prepareDrawer).toHaveBeenCalledOnce()
    expect(filterClick).toHaveBeenCalledWith('color')
    expect(screen.getByText('Active filters')).toBeTruthy()
    expect(screen.getByText('Desktop sort')).toBeTruthy()
    expect(screen.getByText('Mobile sort')).toBeTruthy()
  })

  it('omits applied counts and active-filter content when none are active', () => {
    render(
      <Sheet>
        <ProductListingFilterToolbarView
          actions={{ filterClick: vi.fn(), prepareDrawer: vi.fn() }}
          appliedFilterCount={0}
          filters={[{ id: 'price', label: 'Price' }]}
          hasAppliedFilters={false}
          mobileFilterLabel="Filter"
          slots={{ desktopSort: null, mobileSort: null }}
        />
      </Sheet>,
    )

    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Price' })).toBeTruthy()
    expect(screen.queryByText('Active filters')).toBeNull()
  })
  it('announces unavailable filters without blocking sorting or opening an empty drawer', () => {
    const message = 'Filters are temporarily unavailable. Reload to try again.'
    const { rerender } = render(
      <Sheet>
        <ProductListingFilterToolbarView
          actions={{ filterClick: vi.fn(), prepareDrawer: vi.fn() }}
          appliedFilterCount={0}
          filters={[]}
          hasAppliedFilters={false}
          mobileFilterLabel="Filter"
          unavailableMessage={message}
          slots={{ desktopSort: <button>Sort by</button>, mobileSort: null }}
        />
      </Sheet>,
    )
    expect(screen.getByRole('status').textContent).toBe(message)
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Filter' })
        .disabled,
    ).toBe(true)
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Sort by' })
        .disabled,
    ).toBe(false)
    rerender(
      <Sheet>
        <ProductListingFilterToolbarView
          actions={{ filterClick: vi.fn(), prepareDrawer: vi.fn() }}
          appliedFilterCount={0}
          filters={[{ id: 'price', label: 'Price' }]}
          hasAppliedFilters={false}
          mobileFilterLabel="Filter"
          slots={{ desktopSort: null, mobileSort: null }}
        />
      </Sheet>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Filter' })
        .disabled,
    ).toBe(false)
    expect(screen.getByRole('button', { name: 'Price' })).toBeTruthy()
  })
})
