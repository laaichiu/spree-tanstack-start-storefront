import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MessageKey } from '@/lib/i18n/messages'

import { ProductListingSortMenu } from './product-listing-sort-menu'

const labels: Partial<Record<MessageKey, string>> = {
  'product.sort': 'Sort',
  'product.sortBestSelling': 'Best Selling',
  'product.sortBy': 'Sort by',
  'product.sortNameAsc': 'Name (A-Z)',
  'product.sortNameDesc': 'Name (Z-A)',
  'product.sortNewest': 'Newest',
  'product.sortOldest': 'Oldest',
  'product.sortPriceAsc': 'Price (low-high)',
  'product.sortPriceDesc': 'Price (high-low)',
}

function t(key: MessageKey) {
  return labels[key] ?? key
}

afterEach(cleanup)

describe('ProductListingSortMenu', () => {
  it('shows the active sort and applies a selected option', async () => {
    const onValueChange = vi.fn()

    render(
      <ProductListingSortMenu
        onValueChange={onValueChange}
        t={t}
        value="newest"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sort by' }))

    const options = await screen.findAllByRole('menuitemradio')

    expect(options.map((option) => option.textContent)).toEqual([
      'Price (low-high)',
      'Price (high-low)',
      'Name (A-Z)',
      'Name (Z-A)',
      'Newest',
      'Oldest',
      'Best Selling',
    ])
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Newest' })
        .getAttribute('aria-checked'),
    ).toBe('true')

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Best Selling' }))

    expect(onValueChange).toHaveBeenCalledWith('best-selling')
  })
})
