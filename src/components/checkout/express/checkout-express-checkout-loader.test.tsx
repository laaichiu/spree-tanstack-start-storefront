import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { reportError } from '@/lib/observability/report-error'

import { CheckoutExpressCheckoutLoader } from './checkout-express-checkout-loader'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({ t: (key: string) => key }),
}))
vi.mock('@/lib/stripe/client', () => ({ isStripeConfigured: true }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn() }))

const cart: CheckoutOrder = {
  ...mapSpreeCheckoutToOrder(baseCart, { locale: 'en' }),
  paymentMethods: [
    {
      id: 'pm_stripe',
      name: 'Card',
      description: null,
      gatewayId: 'stripe',
      type: 'SpreeStripe::Gateway',
      sessionRequired: true,
    },
  ],
}
const loadedModule = {
  CheckoutExpressCheckout: ({ cart: current }: { cart: CheckoutOrder }) => (
    <div>Wallet for {current.id}</div>
  ),
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Checkout express chunk loading', () => {
  it('keeps regular checkout available and passes the current cart after loading', async () => {
    let resolveLoad!: (module: typeof loadedModule) => void
    const load = vi.fn(
      () =>
        new Promise<typeof loadedModule>((resolve) => {
          resolveLoad = resolve
        }),
    )
    const { rerender } = render(
      <>
        <p>Regular payment</p>
        <CheckoutExpressCheckoutLoader cart={cart} load={load} />
      </>,
    )
    expect(screen.getByText('checkout.expressCheckout')).toBeTruthy()
    expect(screen.getByText('Regular payment')).toBeTruthy()
    rerender(
      <>
        <p>Regular payment</p>
        <CheckoutExpressCheckoutLoader
          cart={{ ...cart, id: 'cart_next' }}
          load={load}
        />
      </>,
    )
    await act(async () => resolveLoad(loadedModule))
    expect(screen.getByText('Wallet for cart_next')).toBeTruthy()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('does not load wallets for a fully funded cart or missing Stripe method', () => {
    const load = vi.fn(async () => loadedModule)
    const { rerender } = render(
      <CheckoutExpressCheckoutLoader
        cart={{ ...cart, amountDue: { ...cart.amountDue!, amount: 0 } }}
        load={load}
      />,
    )
    expect(load).not.toHaveBeenCalled()
    rerender(
      <CheckoutExpressCheckoutLoader
        cart={{ ...cart, paymentMethods: [] }}
        load={load}
      />,
    )
    expect(load).not.toHaveBeenCalled()
  })

  it('reports chunk failure and supports retry without blocking ordinary payment', async () => {
    const error = new Error('Chunk unavailable')
    const load = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(loadedModule)
    render(
      <>
        <p>Regular payment</p>
        <CheckoutExpressCheckoutLoader cart={cart} load={load} />
      </>,
    )
    expect(
      await screen.findByText('checkout.expressCheckoutUnavailable'),
    ).toBeTruthy()
    expect(screen.getByText('Regular payment')).toBeTruthy()
    expect(reportError).toHaveBeenCalledWith({
      context: 'checkout.expressCheckoutLoad',
      error,
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'checkout.retryPaymentSetup' }),
    )
    expect(await screen.findByText(`Wallet for ${cart.id}`)).toBeTruthy()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('ignores a late chunk failure after wallet eligibility is removed', async () => {
    let rejectLoad!: (reason: Error) => void
    const load = vi.fn(
      () =>
        new Promise<typeof loadedModule>((_, reject) => {
          rejectLoad = reject
        }),
    )
    const { rerender } = render(
      <CheckoutExpressCheckoutLoader cart={cart} load={load} />,
    )
    rerender(
      <CheckoutExpressCheckoutLoader
        cart={{ ...cart, paymentMethods: [] }}
        load={load}
      />,
    )
    await act(async () => rejectLoad(new Error('Late load failure')))
    expect(reportError).not.toHaveBeenCalled()
    expect(screen.queryByText('checkout.expressCheckoutUnavailable')).toBeNull()
  })
})
