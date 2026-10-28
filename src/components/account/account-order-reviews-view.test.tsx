import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountOrderReviewsView } from './account-order-reviews-view'

afterEach(cleanup)

describe('AccountOrderReviewsView', () => {
  it('delegates item toggling and review-form rendering directly', () => {
    const onToggleItem = vi.fn()
    const renderReviewForm = vi.fn((itemId: string) => (
      <div>Review form for {itemId}</div>
    ))

    render(
      <AccountOrderReviewsView
        model={{
          items: [
            {
              active: true,
              id: 'item_123',
              name: 'T-shirt',
              optionsText: '',
              submitted: false,
            },
          ],
          labels: {
            cancel: 'Cancel',
            description: 'Review your items.',
            submitted: 'Submitted',
            title: 'Reviews',
            writeReview: 'Write a review',
          },
        }}
        onToggleItem={onToggleItem}
        renderReviewForm={renderReviewForm}
      />,
    )

    expect(screen.getByText('Review form for item_123')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onToggleItem).toHaveBeenCalledWith('item_123')
    expect(renderReviewForm).toHaveBeenCalledWith('item_123')
  })
})
