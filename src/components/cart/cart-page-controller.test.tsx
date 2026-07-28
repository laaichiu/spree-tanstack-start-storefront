import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { CartPageController } from '@/components/cart/cart-page-controller'
import type { CartSummary } from '@/lib/cart/model/cart'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

const hooks = vi.hoisted(() => ({
  useCart: vi.fn(),
  useCartItemMutations: vi.fn(),
}))

vi.mock('@/components/cart/use-cart', () => ({ useCart: hooks.useCart }))
vi.mock('@/components/cart/use-cart-item-mutations', () => ({
  useCartItemMutations: hooks.useCartItemMutations,
}))

const cart = {
  appliedDiscounts: [],
  appliedGiftCard: null,
  completedSteps: [],
  currencyCode: 'USD',
  currentStep: 'cart',
  deliveryTotal: { amount: 0, currencyCode: 'USD' },
  discountTotal: { amount: 0, currencyCode: 'USD' },
  id: 'cart-1',
  itemCount: 1,
  items: [
    {
      id: 'line-item-1',
      imageUrl: null,
      name: 'Everyday Mug',
      optionValues: [],
      optionsText: '',
      productSlug: 'everyday-mug',
      quantity: 1,
      totalPrice: { amount: 12, currencyCode: 'USD' },
      unitPrice: { amount: 12, currencyCode: 'USD' },
      variantId: 'variant-1',
    },
  ],
  itemTotal: { amount: 12, currencyCode: 'USD' },
  shippingDiscountTotal: { amount: 0, currencyCode: 'USD' },
  shippingRates: [],
  taxTotal: { amount: 0, currencyCode: 'USD' },
  total: { amount: 12, currencyCode: 'USD' },
} satisfies CartSummary

const mutationActions = {
  recoverCartSession: vi.fn(async () => undefined),
  removeItem: vi.fn(async () => undefined),
  updateQuantity: vi.fn(async () => undefined),
}

function renderController({
  initialCart,
  initialCartLoadError,
}: {
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
} = {}) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <CartPageController
        initialCart={initialCart}
        initialCartLoadError={initialCartLoadError}
      >
        {(controller) => {
          if (controller.status === 'error') {
            return (
              <button onClick={() => void controller.recovery.recover()}>
                Recover
              </button>
            )
          }

          if (controller.status === 'ready') {
            return (
              <div>
                <output data-testid="status">{controller.status}</output>
                <output data-testid="cart-id">{controller.cart.id}</output>
                <button
                  onClick={() =>
                    void controller.itemActions.removeItem('line-item-1')
                  }
                >
                  Remove
                </button>
                <button
                  onClick={() =>
                    void controller.itemActions.updateQuantity('line-item-1', 2)
                  }
                >
                  Update
                </button>
              </div>
            )
          }

          return <output data-testid="status">{controller.status}</output>
        }}
      </CartPageController>
    </MarketProvider>,
  )
}

beforeEach(() => {
  hooks.useCartItemMutations.mockReturnValue({
    cartMutationError: null,
    isResetPending: false,
    pendingLineItemId: null,
    ...mutationActions,
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CartPageController', () => {
  it('exposes stable loading and empty states', () => {
    hooks.useCart.mockReturnValue({
      data: undefined,
      error: null,
      isFetched: false,
      isLoading: true,
    })

    const view = renderController()
    expect(screen.getByTestId('status').textContent).toBe('loading')

    hooks.useCart.mockReturnValue({
      data: null,
      error: null,
      isFetched: true,
      isLoading: false,
    })
    view.rerender(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <CartPageController>
          {(controller) => (
            <output data-testid="status">{controller.status}</output>
          )}
        </CartPageController>
      </MarketProvider>,
    )

    expect(screen.getByTestId('status').textContent).toBe('empty')
  })

  it('turns a loader failure into a recoverable capability', () => {
    hooks.useCart.mockReturnValue({
      data: undefined,
      error: null,
      isFetched: false,
      isLoading: true,
    })

    renderController({ initialCartLoadError: 'Raw loader error' })
    fireEvent.click(screen.getByRole('button', { name: 'Recover' }))

    expect(mutationActions.recoverCartSession).toHaveBeenCalledOnce()
  })

  it('exposes only the normalized cart and safe item actions when ready', () => {
    hooks.useCart.mockReturnValue({
      data: cart,
      error: null,
      isFetched: true,
      isLoading: false,
    })

    renderController({ initialCart: cart })

    expect(screen.getByTestId('status').textContent).toBe('ready')
    expect(screen.getByTestId('cart-id').textContent).toBe('cart-1')

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(mutationActions.removeItem).toHaveBeenCalledWith('line-item-1')
    expect(mutationActions.updateQuantity).toHaveBeenCalledWith(
      'line-item-1',
      2,
    )
  })
})
