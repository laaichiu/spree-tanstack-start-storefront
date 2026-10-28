import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AccountOrderDetailPageView } from './account-order-detail-page-view'

afterEach(cleanup)

describe('AccountOrderDetailPageView', () => {
  it('renders the back link directly and preserves ready sections', () => {
    render(
      <AccountOrderDetailPageView
        backLink={<a href="/account/orders">Back to orders</a>}
        model={{
          labels: {
            loadFailed: 'Order unavailable',
            loadFailedDescription: 'Try again later.',
            missingOrder: 'Order not found',
          },
          state: { status: 'ready' },
        }}
        sections={{
          addresses: <div>Addresses</div>,
          header: <div>Order header</div>,
          items: <div>Items</div>,
          orderStatus: <div>Order status</div>,
          reviews: <div>Reviews</div>,
          summary: <div>Summary</div>,
        }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Back to orders' })).toHaveProperty(
      'pathname',
      '/account/orders',
    )
    expect(screen.getByText('Order header')).toBeTruthy()
    expect(screen.getByText('Addresses')).toBeTruthy()
  })
})
