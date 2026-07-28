import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import type {
  CartAppliedDiscount,
  CartAppliedGiftCard,
  CartSummary,
} from '@/lib/cart/model/cart'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { CheckoutDiscountCodeForm } from './checkout-discount-code-form'

const applyCodeMutation = vi.hoisted(() => vi.fn())
const removeDiscountCodeMutation = vi.hoisted(() => vi.fn())
const removeGiftCardMutation = vi.hoisted(() => vi.fn())

vi.mock('./use-checkout-code', () => ({
  useApplyCheckoutCode: () => ({
    isPending: false,
    mutateAsync: applyCodeMutation,
  }),
  useRemoveCheckoutDiscountCode: () => ({
    isPending: false,
    mutateAsync: removeDiscountCodeMutation,
  }),
  useRemoveCheckoutGiftCard: () => ({
    isPending: false,
    mutateAsync: removeGiftCardMutation,
  }),
}))

afterEach(() => {
  cleanup()
  applyCodeMutation.mockReset()
  removeDiscountCodeMutation.mockReset()
  removeGiftCardMutation.mockReset()
})

function renderWithMarket(element: ReactElement) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
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

const discount: CartAppliedDiscount = {
  amount: money(-10),
  code: 'SAVE10',
  description: null,
  id: 'discount_123',
  name: 'Ten off',
  promotionId: 'promotion_123',
}

const giftCard: CartAppliedGiftCard = {
  active: true,
  amountRemaining: money(90),
  appliedAmount: money(-5),
  code: 'GIFT5',
  expired: false,
  expiresAt: null,
  id: 'gift_card_123',
  status: 'active',
}

describe('CheckoutDiscountCodeForm', () => {
  it('applies a normalized code and announces the result', async () => {
    applyCodeMutation.mockResolvedValueOnce({
      order: {},
      success: true,
      type: 'discount',
    })

    renderWithMarket(<CheckoutDiscountCodeForm cart={cartSummary()} />)

    const input = screen.getByRole('textbox', {
      name: /discount code or gift card/i,
    })
    const applyButton = screen.getByRole('button', { name: 'Apply' })

    expect(applyButton.hasAttribute('disabled')).toBe(true)
    fireEvent.change(input, { target: { value: '  SAVE10  ' } })
    expect(applyButton.hasAttribute('disabled')).toBe(false)
    fireEvent.submit(input.closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(applyCodeMutation).toHaveBeenCalledWith('SAVE10')
    })
    expect(screen.getByRole('status').textContent).toBe(
      'Discount code applied.',
    )
  })

  it('renders and removes applied discounts and gift cards', async () => {
    removeDiscountCodeMutation.mockResolvedValueOnce({
      order: {},
      success: true,
    })
    removeGiftCardMutation.mockResolvedValueOnce({
      order: {},
      success: true,
    })

    renderWithMarket(
      <CheckoutDiscountCodeForm
        cart={cartSummary({
          appliedDiscounts: [discount],
          appliedGiftCard: giftCard,
        })}
      />,
    )

    expect(
      screen.queryByRole('textbox', { name: /discount code or gift card/i }),
    ).toBeNull()
    expect(screen.getByText('SAVE10')).toBeTruthy()
    expect(screen.getByText('GIFT5')).toBeTruthy()
    expect(
      screen.getByText('SAVE10').closest('.inline-flex')?.className,
    ).toContain('rounded-full')

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove discount code' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove gift card' }))

    await waitFor(() => {
      expect(removeDiscountCodeMutation).toHaveBeenCalledWith('SAVE10')
      expect(removeGiftCardMutation).toHaveBeenCalledWith('gift_card_123')
    })
  })
})
