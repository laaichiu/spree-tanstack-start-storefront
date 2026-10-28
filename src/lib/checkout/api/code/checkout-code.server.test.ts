// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CartResourceIdentityMismatchError,
  CartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'

import { applyCheckoutCodeToCart } from './checkout-code-apply.server'
import {
  removeCheckoutDiscountCodeFromCart,
  removeCheckoutGiftCardFromCart,
} from './checkout-code-remove.server'

const server = vi.hoisted(() => ({
  applyDiscountCode: vi.fn(),
  applyGiftCard: vi.fn(),
  assertCartMatchesMarket: vi.fn(),
  getCheckoutCartRequestOptions: vi.fn(() => ({
    spreeToken: 'cart-token',
  })),
  removeDiscountCode: vi.fn(),
  removeGiftCard: vi.fn(),
  toCheckoutCodeSuccessResult: vi.fn(),
  toRemoveCheckoutCodeSuccessResult: vi.fn(),
}))

const client = {
  carts: {
    discountCodes: {
      apply: server.applyDiscountCode,
      remove: server.removeDiscountCode,
    },
    giftCards: {
      apply: server.applyGiftCard,
      remove: server.removeGiftCard,
    },
  },
}

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: () => client,
}))

vi.mock('../checkout-session.server', () => ({
  assertCheckoutCartMatchesMarket: server.assertCartMatchesMarket,
  getCheckoutCartRequestOptions: server.getCheckoutCartRequestOptions,
}))

vi.mock('./checkout-code-result.server', () => ({
  toCheckoutCodeSuccessResult: server.toCheckoutCodeSuccessResult,
  toRemoveCheckoutCodeSuccessResult: server.toRemoveCheckoutCodeSuccessResult,
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('checkout code mutation market identity', () => {
  it('does not try a gift card after a discount response identity mismatch', async () => {
    const identityMismatch = new CartResourceIdentityMismatchError()
    server.applyDiscountCode.mockResolvedValue({ id: 'cart-other' })
    server.toCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw identityMismatch
    })

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(identityMismatch)

    expect(server.applyGiftCard).not.toHaveBeenCalled()
  })

  it('does not try a gift card after a discount response type mismatch', async () => {
    const typeMismatch = new CartResourceTypeMismatchError()
    server.applyDiscountCode.mockResolvedValue({ id: 'or-order' })
    server.toCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw typeMismatch
    })

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(typeMismatch)

    expect(server.applyGiftCard).not.toHaveBeenCalled()
  })

  it('does not convert a discount projection failure into a code fallback', async () => {
    const projectionError = new Error('checkout projection failed')
    server.applyDiscountCode.mockResolvedValue({ id: 'cart-us' })
    server.toCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(projectionError)

    expect(server.applyGiftCard).not.toHaveBeenCalled()
  })

  it('does not convert a remove response identity mismatch to a code error', async () => {
    const identityMismatch = new CartResourceIdentityMismatchError()
    server.removeDiscountCode.mockResolvedValue({ id: 'cart-other' })
    server.toRemoveCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw identityMismatch
    })

    await expect(
      removeCheckoutDiscountCodeFromCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(identityMismatch)
  })

  it('does not convert a remove response type mismatch to a code error', async () => {
    const typeMismatch = new CartResourceTypeMismatchError()
    server.removeDiscountCode.mockResolvedValue({ id: 'or-order' })
    server.toRemoveCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw typeMismatch
    })

    await expect(
      removeCheckoutDiscountCodeFromCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(typeMismatch)
  })

  it('does not convert a discount removal projection failure into a code error', async () => {
    const projectionError = new Error('checkout projection failed')
    server.removeDiscountCode.mockResolvedValue({ id: 'cart-us' })
    server.toRemoveCheckoutCodeSuccessResult.mockImplementationOnce(() => {
      throw projectionError
    })

    await expect(
      removeCheckoutDiscountCodeFromCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(projectionError)
  })

  it('asserts the explicit cart before applying a discount or gift card', async () => {
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMatchesMarket.mockRejectedValue(mismatch)

    await expect(
      applyCheckoutCodeToCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(mismatch)

    expect(server.assertCartMatchesMarket).toHaveBeenCalledWith({
      cartId: 'cart-us',
      cartToken: 'cart-token',
      client,
      market,
    })
    expect(server.applyDiscountCode).not.toHaveBeenCalled()
    expect(server.applyGiftCard).not.toHaveBeenCalled()
  })

  it('uses the token returned by the ownership preflight for a discount mutation', async () => {
    server.assertCartMatchesMarket.mockResolvedValue('refreshed-cart-token')
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.applyDiscountCode.mockResolvedValue({ id: 'cart-us' })

    await applyCheckoutCodeToCart({
      cartId: 'cart-us',
      cartToken: 'cart-token',
      code: 'SAVE10',
      market,
    })

    expect(server.applyDiscountCode).toHaveBeenCalledWith('cart-us', 'SAVE10', {
      spreeToken: 'refreshed-cart-token',
    })
    expect(server.toCheckoutCodeSuccessResult).toHaveBeenCalledWith(
      expect.objectContaining({
        cartToken: 'refreshed-cart-token',
        expectedCurrentCartToken: 'cart-token',
      }),
    )
  })

  it('uses the token returned by the ownership preflight for a remove response write', async () => {
    server.assertCartMatchesMarket.mockResolvedValue('refreshed-cart-token')
    server.getCheckoutCartRequestOptions.mockImplementation(
      (cartToken?: string) => ({
        spreeToken: cartToken ?? 'cart-token',
      }),
    )
    server.removeDiscountCode.mockResolvedValue({ id: 'cart-us' })

    await removeCheckoutDiscountCodeFromCart({
      cartId: 'cart-us',
      cartToken: 'cart-token',
      code: 'SAVE10',
      market,
    })

    expect(server.removeDiscountCode).toHaveBeenCalledWith(
      'cart-us',
      'SAVE10',
      {
        spreeToken: 'refreshed-cart-token',
      },
    )
    expect(server.toRemoveCheckoutCodeSuccessResult).toHaveBeenCalledWith(
      expect.objectContaining({
        cartToken: 'refreshed-cart-token',
        expectedCurrentCartToken: 'cart-token',
      }),
    )
  })

  it('asserts the explicit cart before removing a discount code', async () => {
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMatchesMarket.mockRejectedValue(mismatch)

    await expect(
      removeCheckoutDiscountCodeFromCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        code: 'SAVE10',
        market,
      }),
    ).rejects.toBe(mismatch)

    expect(server.removeDiscountCode).not.toHaveBeenCalled()
  })

  it('asserts the explicit cart before removing a gift card', async () => {
    const mismatch = new Error('cart belongs to another market')
    server.assertCartMatchesMarket.mockRejectedValue(mismatch)

    await expect(
      removeCheckoutGiftCardFromCart({
        cartId: 'cart-us',
        cartToken: 'cart-token',
        giftCardId: 'gift-card-us',
        market,
      }),
    ).rejects.toBe(mismatch)

    expect(server.removeGiftCard).not.toHaveBeenCalled()
  })
})
