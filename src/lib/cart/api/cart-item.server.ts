import '@tanstack/react-start/server-only'

import type { Cart as SpreeCart, Client } from '@spree/sdk'

import type { ResolvedMarket } from '@/lib/core/market'
import { clearCartCookiesIfCurrentCartMatches } from '@/lib/cookies/cart-cookie.server'

import { mapSpreeCartToSummary } from '../mappers/cart.mapper'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '../utils/cart-identity'
import { assertSpreeCartResourceMatchesMarket } from '../utils/cart-market'
import {
  CartSessionMismatchError,
  isRecoverableCartCookieError,
} from '../utils/cart-errors'
import {
  assertCartMutationCartMatchesMarket,
  getCartRequestOptions,
  persistCartCookies,
} from './cart-request.server'

export async function updateCartItemForMarket({
  cartId,
  cartToken,
  client,
  lineItemId,
  market,
  quantity,
}: {
  cartId: string
  cartToken: string
  client: Pick<Client, 'carts'>
  lineItemId: string
  market: ResolvedMarket
  quantity: number
}) {
  let updatedCart: SpreeCart
  let mutationCartToken = cartToken

  try {
    const validatedCartToken = await assertCartMutationCartMatchesMarket({
      cartId,
      cartToken,
      client,
      market,
    })
    mutationCartToken = validatedCartToken || cartToken
    updatedCart = await client.carts.items.update(
      cartId,
      lineItemId,
      {
        quantity,
      },
      {
        ...getCartRequestOptions(mutationCartToken),
      },
    )
  } catch (error) {
    if (isRecoverableCartCookieError(error)) {
      clearCartCookiesIfCurrentCartMatches(cartId, mutationCartToken)
    }

    throw error
  }

  assertCartResourceIsCart(updatedCart)
  assertCartResourceMatchesId(updatedCart, cartId)
  assertSpreeCartResourceMatchesMarket(updatedCart, market)

  const normalizedCart = mapSpreeCartToSummary(updatedCart)

  const didPersistCartCookies = persistCartCookies(
    market,
    updatedCart,
    cartId,
    mutationCartToken,
  )

  if (didPersistCartCookies === false) {
    throw new CartSessionMismatchError()
  }

  return normalizedCart
}

export async function removeCartItemForMarket({
  cartId,
  cartToken,
  client,
  lineItemId,
  market,
}: {
  cartId: string
  cartToken: string
  client: Pick<Client, 'carts'>
  lineItemId: string
  market: ResolvedMarket
}) {
  let updatedCart: SpreeCart
  let mutationCartToken = cartToken

  try {
    const validatedCartToken = await assertCartMutationCartMatchesMarket({
      cartId,
      cartToken,
      client,
      market,
    })
    mutationCartToken = validatedCartToken || cartToken
    updatedCart = await client.carts.items.delete(cartId, lineItemId, {
      ...getCartRequestOptions(mutationCartToken),
    })
  } catch (error) {
    if (isRecoverableCartCookieError(error)) {
      clearCartCookiesIfCurrentCartMatches(cartId, mutationCartToken)
    }

    throw error
  }

  assertCartResourceIsCart(updatedCart)
  assertCartResourceMatchesId(updatedCart, cartId)
  assertSpreeCartResourceMatchesMarket(updatedCart, market)

  const normalizedCart = mapSpreeCartToSummary(updatedCart)

  const didPersistCartCookies = persistCartCookies(
    market,
    updatedCart,
    cartId,
    mutationCartToken,
  )

  if (didPersistCartCookies === false) {
    throw new CartSessionMismatchError()
  }

  return normalizedCart
}
