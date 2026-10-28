import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductListingSortMenuView } from './product-listing-sort-menu-view'

afterEach(cleanup)

describe('ProductListingSortMenuView', () => {
  it('forwards the selected value through the direct callback', async () => {
    const onValueChange = vi.fn()

    render(
      <ProductListingSortMenuView
        ariaLabel="Sort by"
        label="Sort"
        onValueChange={onValueChange}
        options={[
          { label: 'Newest', value: 'newest' },
          { label: 'Best selling', value: 'best-selling' },
        ]}
        value="newest"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by' }))
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Best selling' }),
    )

    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('best-selling')
  })
})
