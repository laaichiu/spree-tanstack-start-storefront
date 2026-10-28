import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SearchPopularSearchesView } from './search-popular-searches-view'

afterEach(cleanup)

describe('SearchPopularSearchesView', () => {
  it('delegates the selected popular query', () => {
    const onSelect = vi.fn()

    render(
      <SearchPopularSearchesView
        model={{
          items: [{ id: 'boots', label: 'Boots' }],
          title: 'Popular searches',
        }}
        onSelect={onSelect}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Boots' }))

    expect(onSelect).toHaveBeenCalledWith('Boots')
  })
})
