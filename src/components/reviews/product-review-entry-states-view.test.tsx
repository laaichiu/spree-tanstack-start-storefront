import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductReviewsLoadErrorStateView } from './product-review-entry-states-view'

afterEach(cleanup)

describe('ProductReviewsLoadErrorStateView', () => {
  it('forwards retry through the direct callback', () => {
    const onRetry = vi.fn()

    render(
      <ProductReviewsLoadErrorStateView
        model={{
          description: 'Reviews could not be loaded.',
          retryLabel: 'Try again',
          title: 'Reviews unavailable',
        }}
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
