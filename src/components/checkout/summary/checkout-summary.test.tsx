import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type { CartLineItem, CartSummary } from '@/lib/cart/model/cart'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutSummary } from './checkout-summary'

vi.mock('../code/use-checkout-code', () => ({
  useApplyCheckoutCode: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRemoveCheckoutDiscountCode: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRemoveCheckoutGiftCard: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}))

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

function money(amount: number) {
  return {
    amount,
    currencyCode: 'USD',
  }
}

function lineItem(overrides: Partial<CartLineItem> = {}): CartLineItem {
  return {
    id: 'line_123',
    imageUrl: null,
    name: 'Sample Product',
    optionValues: [],
    optionsText: 'Color: Red',
    productSlug: 'sample-product',
    quantity: 2,
    totalPrice: money(40),
    unitPrice: money(20),
    variantId: 'variant_123',
    ...overrides,
  }
}

function cartSummary(overrides: Partial<CartSummary> = {}): CartSummary {
  return {
    appliedDiscounts: [],
    appliedGiftCard: null,
    completedSteps: [],
    currencyCode: 'USD',
    currentStep: 'payment',
    deliveryTotal: money(0),
    discountTotal: money(0),
    id: 'cart_123',
    itemCount: 0,
    items: [],
    itemTotal: money(42),
    shippingDiscountTotal: money(0),
    shippingRates: [],
    taxTotal: money(0),
    total: money(42),
    ...overrides,
  }
}

describe('CheckoutSummary', () => {
  it('renders the mobile summary trigger collapsed with the chevron next to the label', () => {
    const onMobileToggle = vi.fn()
    const { container } = renderWithMarket(
      <CheckoutSummary
        cart={cartSummary()}
        isMobileOpen={false}
        onMobileToggle={onMobileToggle}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: /order summary.*\$42\.00/i,
    })
    const mobileSummaryPanel = container.querySelector(
      '#checkout-mobile-summary',
    )
    const summaryShell = trigger.closest('aside')

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.firstElementChild?.textContent).toBe('Order summary')
    expect(trigger.lastElementChild?.textContent).toBe('$42.00')
    expect(trigger.className).not.toContain('border-b border-border')
    expect(summaryShell?.className).toContain('border-b border-border')
    expect(mobileSummaryPanel?.className).toContain('hidden')
    expect(mobileSummaryPanel?.firstElementChild?.className).toContain('pt-6')
    expect(
      mobileSummaryPanel?.firstElementChild?.firstElementChild?.className,
    ).toBe('w-full lg:max-w-checkout')

    fireEvent.click(trigger)

    expect(onMobileToggle).toHaveBeenCalledTimes(1)
  })

  it('adds an internal divider while keeping the expanded summary bottom border', () => {
    renderWithMarket(
      <CheckoutSummary
        cart={cartSummary()}
        isMobileOpen
        onMobileToggle={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: /order summary.*\$42\.00/i,
    })

    expect(trigger.className).toContain('border-b border-border')
    expect(trigger.closest('aside')?.className).toContain(
      'border-b border-border',
    )
  })

  it('renders checkout line items with product navigation and options', () => {
    renderWithMarket(
      <CheckoutSummary
        cart={cartSummary({ items: [lineItem()] })}
        isMobileOpen
        onMobileToggle={vi.fn()}
      />,
    )

    expect(
      screen
        .getByRole('link', { name: /sample product/i })
        .getAttribute('href'),
    ).toBe('/us/en/products/sample-product')
    expect(screen.getByText('Red')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('shows the compare-at total above the discounted line total', () => {
    renderWithMarket(
      <CheckoutSummary
        cart={cartSummary({
          items: [
            lineItem({
              compareAtTotalPrice: money(48),
              totalPrice: money(40),
            }),
          ],
        })}
        isMobileOpen
        onMobileToggle={vi.fn()}
      />,
    )

    const compareAtPrice = screen.getByText('$48.00')
    const discountedPrice = screen.getByText('$40.00')

    expect(compareAtPrice.className).toContain('line-through')
    expect(
      Boolean(
        compareAtPrice.compareDocumentPosition(discountedPrice) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(screen.queryByText(/% off/i)).toBeNull()
  })

  it('renders discount breakdown and tax rows from the normalized cart', () => {
    renderWithMarket(
      <CheckoutSummary
        cart={cartSummary({
          appliedDiscounts: [
            {
              amount: money(-10),
              code: 'TENOFF',
              description: null,
              id: 'discount_123',
              name: 'Ten off',
              promotionId: 'promotion_123',
            },
          ],
          discountTotal: money(-10),
          itemTotal: money(100),
          taxTotal: money(5),
          total: money(95),
        })}
        isMobileOpen
        onMobileToggle={vi.fn()}
      />,
    )

    expect(screen.getByText('TENOFF')).toBeTruthy()
    expect(screen.getByText('Tax')).toBeTruthy()
  })
})
