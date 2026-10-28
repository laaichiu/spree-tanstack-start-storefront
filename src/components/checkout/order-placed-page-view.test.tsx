import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OrderPlacedPageView } from './order-placed-page-view'

afterEach(cleanup)

describe('OrderPlacedPageView', () => {
  it('renders the completed-order details child directly', () => {
    render(
      <OrderPlacedPageView
        capabilities={{
          renderProductsLink: (content, className) => (
            <a className={className} href="/products">
              {content}
            </a>
          ),
          renderStorefrontLink: (content, className) => (
            <a className={className} href="/">
              {content}
            </a>
          ),
        }}
        details={<section>Order details</section>}
        model={{
          copy: {
            backToStorefront: 'Back to storefront',
            confirmationSentTo: 'Confirmation sent to',
            continueShopping: 'Continue shopping',
            order: 'Order',
            orderPlacedPreparing: 'Preparing your order.',
            orderPlacedTitle: 'Order placed',
            orderReference: 'Order reference',
            unavailableDescription: 'Order details are unavailable.',
            unavailableTitle: 'Order unavailable',
            thanksForOrder: 'Thanks for your order',
          },
          header: {
            email: 'jane@example.com',
            firstName: 'Jane',
            number: 'R123',
          },
          status: 'ready',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Thanks for your order, Jane' }),
    ).toBeTruthy()
    expect(screen.getByText('Order details')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Back to storefront' }),
    ).toHaveProperty('pathname', '/')
  })
})
