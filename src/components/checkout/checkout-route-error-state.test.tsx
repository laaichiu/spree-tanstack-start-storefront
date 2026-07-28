import { cleanup, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutRouteErrorState } from './checkout-route-error-state'

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

describe('CheckoutRouteErrorState', () => {
  it('offers a return-to-checkout action when a checkout URL is available', () => {
    renderWithMarket(
      <CheckoutRouteErrorState
        checkoutHref="/us/en/checkout/cart_123"
        error={new Error('Payment provider timed out')}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Checkout could not be loaded.' }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'Return to checkout' })
        .getAttribute('href'),
    ).toBe('/us/en/checkout/cart_123')
    expect(screen.getByText('Payment provider timed out')).toBeTruthy()
  })

  it('falls back to shopping when no checkout URL is available', () => {
    renderWithMarket(<CheckoutRouteErrorState />)

    expect(
      screen.queryByRole('link', { name: 'Return to checkout' }),
    ).toBeNull()
    expect(
      screen
        .getByRole('link', { name: 'Continue shopping' })
        .getAttribute('href'),
    ).toBe('/us/en/products')
  })
})
