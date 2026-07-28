import '@tanstack/react-start/server-only'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  readCheckoutCodeErrorMessage,
  shouldPreferDiscountCodeErrorAfterGiftCardError,
  shouldTryGiftCardAfterDiscountCodeError,
} from '@/lib/checkout/utils/code/checkout-code'

import {
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

type CheckoutCodeCartResource = Parameters<
  typeof mapSpreeCheckoutToOrder
>[0] & {
  token?: unknown
}

export type ApplyCheckoutCodeResult =
  | {
      order: CheckoutOrder
      success: true
      type: 'discount' | 'gift_card'
    }
  | {
      error: string
      success: false
    }

export type RemoveCheckoutCodeResult =
  | {
      order: CheckoutOrder
      success: true
    }
  | {
      error: string
      success: false
    }

function readCartToken(resource: CheckoutCodeCartResource) {
  return typeof resource.token === 'string' && resource.token
    ? resource.token
    : undefined
}

function toCheckoutCodeSuccessResult({
  cart,
  cartToken,
  market,
  type,
}: {
  cart: CheckoutCodeCartResource
  cartToken?: string
  market: CheckoutMarket
  type: 'discount' | 'gift_card'
}): ApplyCheckoutCodeResult {
  const updatedCartToken = readCartToken(cart) ?? cartToken

  persistCheckoutCartCookies(cart, market, updatedCartToken)

  return {
    order: mapSpreeCheckoutToOrder(cart),
    success: true,
    type,
  }
}

function toRemoveCheckoutCodeSuccessResult({
  cart,
  cartToken,
  market,
}: {
  cart: CheckoutCodeCartResource
  cartToken?: string
  market: CheckoutMarket
}): RemoveCheckoutCodeResult {
  const updatedCartToken = readCartToken(cart) ?? cartToken

  persistCheckoutCartCookies(cart, market, updatedCartToken)

  return {
    order: mapSpreeCheckoutToOrder(cart),
    success: true,
  }
}

export async function applyCheckoutCodeToCart({
  cartId,
  cartToken,
  code,
  market,
}: {
  cartId: string
  cartToken?: string
  code: string
  market: CheckoutMarket
}): Promise<ApplyCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  try {
    const cart = await client.carts.discountCodes.apply(
      cartId,
      code,
      requestOptions,
    )

    return toCheckoutCodeSuccessResult({
      cart,
      cartToken,
      market,
      type: 'discount',
    })
  } catch (discountError) {
    if (!shouldTryGiftCardAfterDiscountCodeError(discountError)) {
      return {
        error: readCheckoutCodeErrorMessage(discountError),
        success: false,
      }
    }

    try {
      const cart = await client.carts.giftCards.apply(
        cartId,
        code,
        requestOptions,
      )

      return toCheckoutCodeSuccessResult({
        cart,
        cartToken,
        market,
        type: 'gift_card',
      })
    } catch (giftCardError) {
      return {
        error: readCheckoutCodeErrorMessage(
          shouldPreferDiscountCodeErrorAfterGiftCardError(giftCardError)
            ? discountError
            : giftCardError,
        ),
        success: false,
      }
    }
  }
}

export async function removeCheckoutDiscountCodeFromCart({
  cartId,
  cartToken,
  code,
  market,
}: {
  cartId: string
  cartToken?: string
  code: string
  market: CheckoutMarket
}): Promise<RemoveCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  try {
    const cart = await client.carts.discountCodes.remove(
      cartId,
      code,
      requestOptions,
    )

    return toRemoveCheckoutCodeSuccessResult({
      cart,
      cartToken,
      market,
    })
  } catch (error) {
    return {
      error: readCheckoutCodeErrorMessage(
        error,
        'Discount code could not be removed.',
      ),
      success: false,
    }
  }
}

export async function removeCheckoutGiftCardFromCart({
  cartId,
  cartToken,
  giftCardId,
  market,
}: {
  cartId: string
  cartToken?: string
  giftCardId: string
  market: CheckoutMarket
}): Promise<RemoveCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  try {
    const cart = await client.carts.giftCards.remove(
      cartId,
      giftCardId,
      requestOptions,
    )

    return toRemoveCheckoutCodeSuccessResult({
      cart,
      cartToken,
      market,
    })
  } catch (error) {
    return {
      error: readCheckoutCodeErrorMessage(
        error,
        'Gift card could not be removed.',
      ),
      success: false,
    }
  }
}
