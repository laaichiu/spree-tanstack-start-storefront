import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SheetTrigger } from '@/components/ui/sheet'
import { ProductListingControlsView } from './product-listing-controls-view'

afterEach(cleanup)

describe('ProductListingControlsView', () => {
  it('forwards controlled sheet changes through the direct callback', () => {
    const onOpenChange = vi.fn()

    const { getByRole } = render(
      <ProductListingControlsView
        onOpenChange={onOpenChange}
        open={false}
        slots={{
          filterDrawer: <div>Filter drawer</div>,
          filterToolbar: <SheetTrigger>Open filters</SheetTrigger>,
        }}
      />,
    )

    fireEvent.click(getByRole('button', { name: 'Open filters' }))

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true)
  })
})
