import '@tanstack/react-start/server-only'

import type { CheckoutOrder } from '@/lib/checkout/contracts'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import {
  CheckoutCartSessionMismatchError,
  persistCheckoutCartCookies,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'

export type CheckoutCodeCartResource = Parameters<
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

function mapValidatedCheckoutCodeCart(
  cart: CheckoutCodeCartResource,
  cartId: string,
  market: CheckoutMarket,
) {
  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, cartId)
  assertSpreeCartResourceMatchesMarket(cart, market)

  return mapSpreeCheckoutToOrder(cart, { locale: market.locale })
}

export function toCheckoutCodeSuccessResult({
  cart,
  cartId,
  cartToken,
  expectedCurrentCartToken,
  market,
  type,
}: {
  cart: CheckoutCodeCartResource
  cartId: string
  cartToken?: string
  expectedCurrentCartToken?: string
  market: CheckoutMarket
  type: 'discount' | 'gift_card'
}): ApplyCheckoutCodeResult {
  const order = mapValidatedCheckoutCodeCart(cart, cartId, market)

  const didPersistCartCookies = persistCheckoutCartCookies(cart, market, {
    expectedCartId: cartId,
    expectedCurrentCartToken,
    fallbackToken: cartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }

  return {
    order,
    success: true,
    type,
  }
}

export function toRemoveCheckoutCodeSuccessResult({
  cart,
  cartId,
  cartToken,
  expectedCurrentCartToken,
  market,
}: {
  cart: CheckoutCodeCartResource
  cartId: string
  cartToken?: string
  expectedCurrentCartToken?: string
  market: CheckoutMarket
}): RemoveCheckoutCodeResult {
  const order = mapValidatedCheckoutCodeCart(cart, cartId, market)

  const didPersistCartCookies = persistCheckoutCartCookies(cart, market, {
    expectedCartId: cartId,
    expectedCurrentCartToken,
    fallbackToken: cartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }

  return {
    order,
    success: true,
  }
}
