import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSheetHandle } from '@/components/ui/sheet'
import { SearchDrawerShellView } from './search-drawer-shell-view'

afterEach(cleanup)

describe('SearchDrawerShellView', () => {
  it('delegates the controlled close event and preserves shell regions', () => {
    const onOpenChange = vi.fn()

    render(
      <SearchDrawerShellView
        closeLabel="Close search"
        handle={createSheetHandle()}
        onOpenChange={onOpenChange}
        open
        slots={{
          content: <div>Search content</div>,
          form: <form aria-label="Search form" />,
        }}
        title="Search"
        triggerId={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close search' }))

    expect(onOpenChange).toHaveBeenCalledWith(false, null)
    expect(screen.getByRole('form', { name: 'Search form' })).toBeTruthy()
    expect(screen.getByText('Search content')).toBeTruthy()
  })
})
