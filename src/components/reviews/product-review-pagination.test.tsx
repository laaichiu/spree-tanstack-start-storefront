import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getProductReviewPaginationPresentation } from './product-review-pagination-model'
import { ProductReviewsPaginationView } from './product-review-ready-section-view'

afterEach(cleanup)

const labels = {
  navigation: 'Reviews',
  next: 'Next page',
  pageOf: 'Page {page} of {pages}',
  previous: 'Previous page',
}

function presentation(page: number, pageCount: number, disabled = false) {
  return getProductReviewPaginationPresentation({
    disabled,
    labels,
    locale: 'en',
    pagination: {
      page,
      pageCount,
      nextPage: page < pageCount ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    },
  })
}

describe('review pagination', () => {
  it.each([
    [1, 3, [1, 2, 3]],
    [1, 12, [1, 2, 3, 4, 5]],
    [6, 12, [4, 5, 6, 7, 8]],
    [12, 12, [8, 9, 10, 11, 12]],
  ])(
    'shows a bounded page window at page %i of %i',
    (page, count, expected) => {
      expect(
        presentation(page, count).pages.map((item) => item.number),
      ).toEqual(expected)
    },
  )

  it.each([
    [1, 12, [1, 2, 3]],
    [6, 12, [5, 6, 7]],
    [12, 12, [10, 11, 12]],
  ])(
    'keeps the current page in a compact window at page %i of %i',
    (page, count, expected) => {
      expect(
        presentation(page, count)
          .pages.filter((item) => item.visibleInCompactLayout)
          .map((item) => item.number),
      ).toEqual(expected)
    },
  )

  it('marks the current page and navigates by number or arrow', () => {
    const actions = { goToPage: vi.fn(), next: vi.fn(), previous: vi.fn() }
    render(
      <ProductReviewsPaginationView
        actions={actions}
        model={presentation(2, 3)}
      />,
    )

    expect(
      screen.getByRole('button', { name: '2' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(screen.getByText('Page 2 of 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(actions.goToPage).toHaveBeenCalledWith(3)
    expect(actions.previous).toHaveBeenCalledOnce()
    expect(actions.next).toHaveBeenCalledOnce()
  })

  it('hides non-compact page buttons below the responsive breakpoint', () => {
    const actions = { goToPage: vi.fn(), next: vi.fn(), previous: vi.fn() }
    render(
      <ProductReviewsPaginationView
        actions={actions}
        model={presentation(6, 12)}
      />,
    )

    const currentPageButton = screen.getByText('6').closest('button')
    const nonCompactPageButton = screen.getByText('4').closest('button')

    expect(currentPageButton?.classList.contains('hidden')).toBe(false)
    expect(nonCompactPageButton?.classList.contains('hidden')).toBe(true)
    expect(nonCompactPageButton?.classList.contains('sm:inline-flex')).toBe(
      true,
    )
  })

  it('disables unavailable arrows and pending page changes', () => {
    const actions = { goToPage: vi.fn(), next: vi.fn(), previous: vi.fn() }
    const { rerender } = render(
      <ProductReviewsPaginationView
        actions={actions}
        model={presentation(1, 3)}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toHaveProperty('disabled', true)
    rerender(
      <ProductReviewsPaginationView
        actions={actions}
        model={presentation(2, 3, true)}
      />,
    )
    expect(
      screen
        .getAllByRole('button')
        .every((button) => button.hasAttribute('disabled')),
    ).toBe(true)
  })
})
