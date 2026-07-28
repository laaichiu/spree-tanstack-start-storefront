import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import {
  CheckoutSubmitButton,
  getCheckoutSubmitButtonLabelKey,
} from './checkout-submit-button'

afterEach(() => {
  cleanup()
})

function renderWithMarket(element: ReactElement) {
  const market = getDefaultResolvedMarket()

  return render(
    <MarketProvider market={market} marketOptions={[]}>
      {element}
    </MarketProvider>,
  )
}

describe('getCheckoutSubmitButtonLabelKey', () => {
  it('uses processing copy while payment submission is pending', () => {
    expect(
      getCheckoutSubmitButtonLabelKey({
        amountDueAmount: 42,
        hasSessionPaymentMethod: true,
        isPending: true,
      }),
    ).toBe('checkout.processingPayment')
  })

  it('uses pay now only when money is due through a session payment method', () => {
    expect(
      getCheckoutSubmitButtonLabelKey({
        amountDueAmount: 42,
        hasSessionPaymentMethod: true,
        isPending: false,
      }),
    ).toBe('checkout.payNow')

    expect(
      getCheckoutSubmitButtonLabelKey({
        amountDueAmount: 0,
        hasSessionPaymentMethod: true,
        isPending: false,
      }),
    ).toBe('checkout.placeOrder')
  })
})

describe('CheckoutSubmitButton', () => {
  it('submits through the parent-owned checkout handler', () => {
    const handleSubmit = vi.fn()

    renderWithMarket(
      <CheckoutSubmitButton
        amountDueAmount={42}
        disabled={false}
        hasSessionPaymentMethod={true}
        isPending={false}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }))

    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not submit while disabled', () => {
    const handleSubmit = vi.fn()

    renderWithMarket(
      <CheckoutSubmitButton
        amountDueAmount={42}
        disabled={true}
        hasSessionPaymentMethod={true}
        isPending={true}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /processing payment/i }))

    expect(handleSubmit).not.toHaveBeenCalled()
  })
})
