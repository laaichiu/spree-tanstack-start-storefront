import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { OrderDetail } from '@/lib/account/contracts'
import { AccountOrderDetail } from './account-order-detail'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))
vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => key,
  }),
}))
vi.mock('./account-order-detail-cards', () => ({
  OrderHeaderCard: () => null,
  OrderItemsCard: () => null,
  OrderSummaryCard: () => null,
}))
vi.mock('./account-order-detail-sections', () => ({
  OrderAddressSections: () => null,
  OrderStatusSections: () => null,
}))
vi.mock('@/components/reviews/account-order-reviews', () => ({
  AccountOrderReviews: ({ orderId }: { orderId: string }) => (
    <button type="button">Review {orderId}</button>
  ),
}))

const order: OrderDetail = {
  amountDue: '0.00',
  billingAddress: null,
  completedAt: '2026-10-01T12:00:00Z',
  customerNote: null,
  discountTotal: '0.00',
  displayAmountDue: '$0.00',
  displayDeliveryTotal: '$0.00',
  displayDiscountTotal: '$0.00',
  displayGiftCardTotal: '$0.00',
  displayItemTotal: '$24.00',
  displayStoreCreditTotal: '$0.00',
  displayTaxTotal: '$0.00',
  displayTotal: '$24.00',
  fulfillments: [],
  fulfillmentStatus: 'fulfilled',
  giftCardTotal: '0.00',
  id: 'or_review',
  items: [],
  number: 'R123456',
  payments: [],
  paymentStatus: 'paid',
  shippingAddress: null,
  storeCreditTotal: '0.00',
  taxTotal: '0.00',
  totalQuantity: 1,
}

afterEach(cleanup)

describe('AccountOrderDetail review entry', () => {
  it.each(['fulfilled', 'delivered', 'shipped'])(
    'shows the review entry for %s orders',
    async (fulfillmentStatus) => {
      render(
        <AccountOrderDetail
          order={{ ...order, fulfillmentStatus }}
          orderId={order.id}
          reviewsEnabled
        />,
      )

      expect(
        await screen.findByRole('button', { name: 'Review or_review' }),
      ).toBeTruthy()
    },
  )

  it.each(['unfulfilled', 'partial', 'backorder', 'canceled', 'unknown', null])(
    'hides the review entry for %s orders',
    (fulfillmentStatus) => {
      render(
        <AccountOrderDetail
          order={{ ...order, fulfillmentStatus }}
          orderId={order.id}
          reviewsEnabled
        />,
      )

      expect(screen.queryByRole('button')).toBeNull()
    },
  )

  it('respects the review feature setting', () => {
    render(
      <AccountOrderDetail
        order={order}
        orderId={order.id}
        reviewsEnabled={false}
      />,
    )

    expect(screen.queryByRole('button')).toBeNull()
  })
})
