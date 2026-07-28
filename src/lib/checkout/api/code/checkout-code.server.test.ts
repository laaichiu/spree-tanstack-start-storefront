import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  applyCheckoutCodeToCart,
  removeCheckoutDiscountCodeFromCart,
  removeCheckoutGiftCardFromCart,
} from './checkout-code.server'
import {
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

vi.mock('@/lib/checkout/mappers/checkout.mapper', () => ({
  mapSpreeCheckoutToOrder: vi.fn((resource: { id: string }) => ({
    currentStep: 'payment',
    id: resource.id,
  })),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: vi.fn(),
}))

vi.mock('../checkout-session.server', () => ({
  getCheckoutCartRequestOptions: vi.fn((cartToken?: string) => ({
    ...(cartToken ? { spreeToken: cartToken } : {}),
  })),
  persistCheckoutCartCookies: vi.fn(),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market_123',
}

function checkoutCart(id: string, token = 'next-cart-token') {
  return {
    id,
    token,
  }
}

function spreeError(message: string, fields: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), fields)
}

function setSpreeClient({
  applyDiscount,
  applyGiftCard,
  removeDiscount,
  removeGiftCard,
}: {
  applyDiscount?: unknown
  applyGiftCard?: unknown
  removeDiscount?: unknown
  removeGiftCard?: unknown
} = {}) {
  const discountApply = vi.fn(async () => applyDiscount)
  const giftCardApply = vi.fn(async () => applyGiftCard)
  const discountRemove = vi.fn(async () => removeDiscount)
  const giftCardRemove = vi.fn(async () => removeGiftCard)

  vi.mocked(getServerSpreeClientForMarket).mockReturnValue({
    carts: {
      discountCodes: {
        apply: discountApply,
        remove: discountRemove,
      },
      giftCards: {
        apply: giftCardApply,
        remove: giftCardRemove,
      },
    },
  } as never)

  return {
    discountApply,
    discountRemove,
    giftCardApply,
    giftCardRemove,
  }
}

describe('checkout code server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies discount codes before trying gift cards', async () => {
    const updatedCart = checkoutCart('cart_123')
    const { discountApply, giftCardApply } = setSpreeClient({
      applyDiscount: updatedCart,
    })

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).resolves.toEqual({
      order: {
        currentStep: 'payment',
        id: 'cart_123',
      },
      success: true,
      type: 'discount',
    })
    expect(discountApply).toHaveBeenCalledWith('cart_123', 'SAVE10', {
      spreeToken: 'cart-token',
    })
    expect(giftCardApply).not.toHaveBeenCalled()
    expect(persistCheckoutCartCookies).toHaveBeenCalledWith(
      updatedCart,
      market,
      'next-cart-token',
    )
    expect(mapSpreeCheckoutToOrder).toHaveBeenCalledWith(updatedCart)
  })

  it('falls back to applying gift cards after recoverable discount errors', async () => {
    const discountApplyError = spreeError('Discount code is invalid.', {
      status: 422,
    })
    const updatedCart = checkoutCart('cart_123', 'gift-card-cart-token')
    const { discountApply, giftCardApply } = setSpreeClient({
      applyGiftCard: updatedCart,
    })

    discountApply.mockRejectedValueOnce(discountApplyError)

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        code: 'GC50',
        market,
      }),
    ).resolves.toEqual({
      order: {
        currentStep: 'payment',
        id: 'cart_123',
      },
      success: true,
      type: 'gift_card',
    })
    expect(giftCardApply).toHaveBeenCalledWith('cart_123', 'GC50', {
      spreeToken: 'cart-token',
    })
    expect(persistCheckoutCartCookies).toHaveBeenCalledWith(
      updatedCart,
      market,
      'gift-card-cart-token',
    )
  })

  it('keeps the discount error when gift card lookup also misses', async () => {
    const { discountApply, giftCardApply } = setSpreeClient()

    discountApply.mockRejectedValueOnce(
      spreeError('Discount code is invalid.', {
        status: 422,
      }),
    )
    giftCardApply.mockRejectedValueOnce(
      spreeError('Gift card was not found.', {
        code: 'gift_card_not_found',
      }),
    )

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        code: 'NOPE',
        market,
      }),
    ).resolves.toEqual({
      error: 'Discount code is invalid.',
      success: false,
    })
    expect(persistCheckoutCartCookies).not.toHaveBeenCalled()
  })

  it('does not try gift cards after non-recoverable discount errors', async () => {
    const { discountApply, giftCardApply } = setSpreeClient()

    discountApply.mockRejectedValueOnce(
      spreeError('Checkout code could not be applied.', {
        status: 500,
      }),
    )

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).resolves.toEqual({
      error: 'Checkout code could not be applied.',
      success: false,
    })
    expect(giftCardApply).not.toHaveBeenCalled()
  })

  it('removes discount codes and persists the returned cart token', async () => {
    const updatedCart = checkoutCart('cart_123')
    const { discountRemove } = setSpreeClient({
      removeDiscount: updatedCart,
    })

    await expect(
      removeCheckoutDiscountCodeFromCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).resolves.toEqual({
      order: {
        currentStep: 'payment',
        id: 'cart_123',
      },
      success: true,
    })
    expect(discountRemove).toHaveBeenCalledWith('cart_123', 'SAVE10', {
      spreeToken: 'cart-token',
    })
    expect(persistCheckoutCartCookies).toHaveBeenCalledWith(
      updatedCart,
      market,
      'next-cart-token',
    )
  })

  it('normalizes gift card removal failures', async () => {
    const { giftCardRemove } = setSpreeClient()

    giftCardRemove.mockRejectedValueOnce('not found')

    await expect(
      removeCheckoutGiftCardFromCart({
        cartId: 'cart_123',
        cartToken: 'cart-token',
        giftCardId: 'gift_card_123',
        market,
      }),
    ).resolves.toEqual({
      error: 'Gift card could not be removed.',
      success: false,
    })
    expect(getCheckoutCartRequestOptions).toHaveBeenCalledWith('cart-token')
  })
})
