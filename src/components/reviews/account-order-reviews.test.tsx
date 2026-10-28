import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountOrderReviews } from './account-order-reviews'

const market = vi.hoisted(() => ({
  country: 'us',
  locale: 'en',
}))

const session = vi.hoisted(() => ({
  customerId: 'cust_first',
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market,
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/account/client/account-session-provider', () => ({
  useAccountSession: () => ({ id: session.customerId }),
  useAccountSessionRequiredRedirect: () => vi.fn(),
}))

vi.mock('./product-review-form', () => ({
  ProductReviewForm: ({
    item,
    onSubmitted,
  }: {
    item: { id: string; name: string }
    onSubmitted: () => void
  }) => {
    const [draft, setDraft] = useState(item.name)

    return (
      <div data-testid={`review-form-${item.id}`}>
        <span>{draft}</span>
        <button onClick={() => setDraft(`${item.name} draft`)} type="button">
          Change draft
        </button>
        <button onClick={onSubmitted} type="button">
          Submit review
        </button>
      </div>
    )
  },
}))

const item = {
  id: 'li_shirt',
  name: 'Linen shirt',
  optionsText: '',
  productId: 'prod_shirt',
  variantId: 'variant_shirt',
}

const secondItem = {
  id: 'li_pants',
  name: 'Canvas pants',
  optionsText: '',
  productId: 'prod_pants',
  variantId: 'variant_pants',
}

beforeEach(() => {
  market.country = 'us'
  market.locale = 'en'
  session.customerId = 'cust_first'
})

afterEach(cleanup)

describe('AccountOrderReviews lifecycle', () => {
  it('resets local review state when the market changes', () => {
    const { rerender } = render(
      <AccountOrderReviews items={[item]} orderId="or_order" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'reviews.writeReview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(screen.getByText('reviews.submitted')).toBeTruthy()

    market.country = 'de'
    market.locale = 'de'
    rerender(<AccountOrderReviews items={[item]} orderId="or_order" />)

    expect(screen.queryByText('reviews.submitted')).toBeNull()
    expect(screen.queryByTestId('review-form-li_shirt')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'reviews.writeReview' }),
    ).toBeTruthy()
  })

  it('resets local review state when the order changes', () => {
    const { rerender } = render(
      <AccountOrderReviews items={[item]} orderId="or_first" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'reviews.writeReview' }))

    expect(screen.getByTestId('review-form-li_shirt')).toBeTruthy()

    rerender(<AccountOrderReviews items={[item]} orderId="or_second" />)

    expect(screen.queryByTestId('review-form-li_shirt')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'reviews.writeReview' }),
    ).toBeTruthy()
  })

  it('resets local review state when the customer changes', () => {
    const { rerender } = render(
      <AccountOrderReviews items={[item]} orderId="or_order" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'reviews.writeReview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))

    expect(screen.getByText('reviews.submitted')).toBeTruthy()

    session.customerId = 'cust_second'
    rerender(<AccountOrderReviews items={[item]} orderId="or_order" />)

    expect(screen.queryByText('reviews.submitted')).toBeNull()
    expect(screen.queryByTestId('review-form-li_shirt')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'reviews.writeReview' }),
    ).toBeTruthy()
  })

  it('remounts the form when the active order item changes', () => {
    render(
      <AccountOrderReviews items={[item, secondItem]} orderId="or_order" />,
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: 'reviews.writeReview' })[0],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Change draft' }))

    expect(screen.getByText('Linen shirt draft')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'reviews.writeReview' }))

    const secondForm = screen.getByTestId('review-form-li_pants')

    expect(secondForm).toBeTruthy()
    expect(within(secondForm).getByText('Canvas pants')).toBeTruthy()
    expect(screen.queryByText('Linen shirt draft')).toBeNull()
  })
})
