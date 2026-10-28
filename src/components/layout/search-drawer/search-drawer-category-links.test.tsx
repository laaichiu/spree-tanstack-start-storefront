import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchDrawerCategoryLinks } from './search-drawer-category-links'

const mocks = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }))
vi.mock('@/lib/catalog/client/use-search-suggestions', () => ({
  useSearchSuggestionCategories: mocks.query,
}))
vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => key,
  }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    onClick,
    params,
  }: {
    children: ReactNode
    className?: string
    onClick: () => void
    params: { country: string; locale: string; _splat: string }
  }) => (
    <a
      className={className}
      href={`/${params.country}/${params.locale}/collections/${params._splat}`}
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
    >
      {children}
    </a>
  ),
}))

const selected = {
  children: [],
  id: 'ctg_coffee',
  imageUrl: null,
  name: 'Coffee Machines',
  permalink: 'kitchen/coffee-machines',
}

afterEach(cleanup)
beforeEach(() => {
  vi.resetAllMocks()
  mocks.query.mockReturnValue({
    data: [],
    isError: false,
    isPending: false,
    refetch: mocks.refetch,
  })
})

describe('configured search drawer categories', () => {
  it('enables the current market query only while the drawer is open', () => {
    const { rerender } = render(
      <SearchDrawerCategoryLinks open onSelect={vi.fn()} />,
    )
    expect(mocks.query).toHaveBeenLastCalledWith({
      enabled: true,
      market: { country: 'us', locale: 'en' },
    })
    rerender(<SearchDrawerCategoryLinks open={false} onSelect={vi.fn()} />)
    expect(mocks.query).toHaveBeenLastCalledWith({
      enabled: false,
      market: { country: 'us', locale: 'en' },
    })
  })

  it('renders configured child category links and calls the selection callback', () => {
    mocks.query.mockReturnValue({
      data: [selected],
      isError: false,
      isPending: false,
    })
    const onSelect = vi.fn()
    render(<SearchDrawerCategoryLinks open onSelect={onSelect} />)
    const link = screen.getByRole('link', { name: 'Coffee Machines' })
    expect(link.getAttribute('href')).toBe(
      '/us/en/collections/kitchen/coffee-machines',
    )
    fireEvent.click(link)
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('hides an empty section without substituting navigation categories', () => {
    const { container } = render(
      <SearchDrawerCategoryLinks open onSelect={vi.fn()} />,
    )
    expect(container.childElementCount).toBe(0)
  })

  it('shows an accessible loading state without links', () => {
    mocks.query.mockReturnValue({ isPending: true, isError: false })
    const { container } = render(
      <SearchDrawerCategoryLinks open onSelect={vi.fn()} />,
    )
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows the translated failure and retry action without stale category links', () => {
    mocks.query.mockReturnValue({
      data: [selected],
      isPending: false,
      isError: true,
      refetch: mocks.refetch,
    })
    render(<SearchDrawerCategoryLinks open onSelect={vi.fn()} />)
    expect(screen.getByRole('status').textContent).toContain(
      'header.suggestedCategoriesUnavailable',
    )
    expect(screen.queryByRole('link')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'footer.retryInteractive' }),
    )
    expect(mocks.refetch).toHaveBeenCalledOnce()
  })
})
