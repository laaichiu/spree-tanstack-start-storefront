import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MouseEventHandler, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CartPageControllerValue } from '@/components/cart/cart-page-controller'
import { CartPageReferenceView } from '@/components/cart/cart-page-reference-view'
import { MarketProvider } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/model/cart'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    onClick,
  }: {
    children: ReactNode
    className?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
  }) => (
    <a className={className} href="/fixture-link" onClick={onClick}>
      {children}
    </a>
  ),
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

function createController() {
  const removeItem = vi.fn(async () => undefined)
  const updateQuantity = vi.fn(async () => undefined)
  const controller: CartPageControllerValue = {
    cart,
    itemActions: {
      error: null,
      pendingLineItemId: null,
      removeItem,
      updateQuantity,
    },
    status: 'ready',
  }

  return { controller, removeItem, updateQuantity }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('cart page reference composition', () => {
  it('renders normalized cart facts and invokes safe item actions', () => {
    const fixture = createController()

    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <CartPageReferenceView controller={fixture.controller} />
      </MarketProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /Your Bag/ }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Everyday Mug' })).toBeTruthy()
    expect(screen.getAllByText('$12.00').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Shipping and taxes are calculated at checkout.')
        .length,
    ).toBe(2)

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))

    expect(fixture.updateQuantity).toHaveBeenCalledWith('line-item-1', 2)
    expect(fixture.removeItem).toHaveBeenCalledWith('line-item-1')
  })
})

it('keeps cart page composition outside commerce infrastructure boundaries', () => {
  const compositionFiles = [
    'cart-page-content.tsx',
    'cart-page-controller.tsx',
    'cart-page-reference-view.tsx',
    'cart-page-line-item.tsx',
    'cart-page-order-summary.tsx',
  ]
  const source = compositionFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')

  expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
  expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
  expect(source).not.toMatch(/\.server(?:'|")/)
})

it('keeps storefront shipping promotion configuration outside presentation', () => {
  const shippingFiles = [
    'cart-drawer.tsx',
    'cart-drawer-footer.tsx',
    'cart-drawer-header.tsx',
    'cart-page-reference-view.tsx',
  ]
  const source = shippingFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')

  expect(source).not.toMatch(/import\.meta\.env|VITE_|\$100|amount:\s*100/)
  expect(source).not.toMatch(/DEFAULT_FREE_SHIPPING|@spree\/sdk/)
})
