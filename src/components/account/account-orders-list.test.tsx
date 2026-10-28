import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { OrderSummary } from '@/lib/account/contracts'
import { AccountOrdersList } from './account-orders-list'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => (
    <a className={className} href="#">
      {children}
    </a>
  ),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => key,
  }),
}))

afterEach(cleanup)

const order: OrderSummary = {
  completedAt: '2026-10-01T12:00:00Z',
  displayTotal: '$24.00',
  fulfillmentStatus: 'fulfilled',
  id: 'or_123',
  number: 'R123456',
  paymentStatus: 'paid',
  totalQuantity: 1,
}

describe('AccountOrdersList', () => {
  it('shows the load error instead of stale orders', () => {
    render(<AccountOrdersList loadError orders={[order]} />)

    expect(screen.getByText('account.ordersLoadFailed')).toBeTruthy()
    expect(screen.queryByText('#R123456')).toBeNull()
  })

  it('offers shopping from the empty state', () => {
    render(<AccountOrdersList orders={[]} />)

    expect(screen.getByText('account.noOrders')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'account.startShopping' }),
    ).toBeTruthy()
  })

  it('renders order status and a detail link for each order', () => {
    render(<AccountOrdersList orders={[order]} />)

    expect(screen.getByText('account.orderHistory')).toBeTruthy()
    expect(screen.getByText('#R123456')).toBeTruthy()
    expect(screen.getByText('Paid')).toBeTruthy()
    expect(screen.getByText('Fulfilled')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'account.viewOrder' })).toBeTruthy()
  })
})
