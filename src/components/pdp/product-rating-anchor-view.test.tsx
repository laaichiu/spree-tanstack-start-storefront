import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductRatingAnchorView } from './product-rating-anchor-view'

afterEach(() => {
  cleanup()
  document.getElementById('reviews')?.remove()
})

describe('ProductRatingAnchorView', () => {
  it('scrolls to reviews without changing the URL', () => {
    const section = document.createElement('section')
    const scrollIntoView = vi.fn()
    section.id = 'reviews'
    section.scrollIntoView = scrollIntoView
    document.body.append(section)

    render(
      <ProductRatingAnchorView
        model={{
          ariaLabel: 'Read reviews',
          label: '4.5 (2 reviews)',
          rating: 4.5,
          ratingLabel: '4.5 / 5',
          targetId: 'reviews',
        }}
      />,
    )

    const action = screen.getByRole('button', { name: 'Read reviews' })
    expect(action.getAttribute('aria-controls')).toBe('reviews')
    expect(screen.getByText('4.5 (2 reviews)')).toBeTruthy()
    expect(screen.getByLabelText('4.5 / 5')).toBeTruthy()

    fireEvent.click(action)

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(window.location.hash).toBe('')
  })
})
