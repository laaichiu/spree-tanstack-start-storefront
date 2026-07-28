import { readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { CheckoutReadyStateControllerValue } from '@/components/checkout/checkout-ready-state-controller'
import { CheckoutReadyStateReferenceView } from '@/components/checkout/checkout-ready-state-reference-view'

afterEach(cleanup)

describe('checkout ready-state reference composition', () => {
  it('only arranges protected checkout capabilities and a stable error', () => {
    const controller = {
      checkoutError: 'Payment needs your attention.',
      delivery: <div data-testid="checkout-slot">delivery</div>,
      express: <div data-testid="checkout-slot">express</div>,
      payment: <div data-testid="checkout-slot">payment</div>,
      submit: <div data-testid="checkout-slot">submit</div>,
      summary: <div data-testid="checkout-slot">summary</div>,
    } satisfies CheckoutReadyStateControllerValue

    render(<CheckoutReadyStateReferenceView controller={controller} />)

    expect(screen.getByText('Payment needs your attention.')).toBeTruthy()
    expect(
      screen.getAllByTestId('checkout-slot').map((slot) => slot.textContent),
    ).toEqual(['summary', 'express', 'delivery', 'payment', 'submit'])
  })

  it('does not render an empty global error state', () => {
    const controller = {
      checkoutError: null,
      delivery: null,
      express: null,
      payment: null,
      submit: null,
      summary: null,
    } satisfies CheckoutReadyStateControllerValue

    const { container } = render(
      <CheckoutReadyStateReferenceView controller={controller} />,
    )

    expect(container.querySelector('.text-destructive')).toBeNull()
  })
})

it('keeps checkout presentation outside commerce infrastructure', () => {
  const source = readFileSync(
    'src/components/checkout/checkout-ready-state-reference-view.tsx',
    'utf8',
  )

  expect(source).not.toMatch(/@tanstack|@spree\/sdk/)
  expect(source).not.toMatch(/\/lib\//)
  expect(source).not.toMatch(/serverFn|queryClient|token|useCheckout/)
  expect(source).not.toMatch(/onSubmit|onPayment|paymentSectionRef/)
})
