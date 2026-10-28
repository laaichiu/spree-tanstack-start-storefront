import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckoutSummaryTotalsView } from './checkout-summary-totals-view'

afterEach(cleanup)

describe('CheckoutSummaryTotalsView', () => {
  it('renders the discount form directly with totals', () => {
    render(
      <CheckoutSummaryTotalsView
        discountCodeForm={<div>Discount code form</div>}
        model={{
          amountDue: '$80.00',
          currencyCode: 'USD',
          labels: { amountDue: 'Amount due', total: 'Total' },
          rows: [{ kind: 'subtotal', label: 'Subtotal', value: '$80.00' }],
          total: '$80.00',
        }}
      />,
    )

    expect(screen.getByText('Discount code form')).toBeTruthy()
    expect(screen.getByText('Subtotal')).toBeTruthy()
    expect(screen.getByText('Total')).toBeTruthy()
    expect(screen.getAllByText('$80.00')).toHaveLength(3)
  })
})
