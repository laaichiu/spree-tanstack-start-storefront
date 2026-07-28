import '@tanstack/react-start/server-only'

import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { clearCartCookies } from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  assertSpreeCartResourceMatchesMarket,
  isCartMarketMismatchError,
} from '@/lib/cart/utils/cart-market'
import { isRecoverableCartResponseError } from '@/lib/cart/utils/cart-errors'
import {
  getSelectedCheckoutShippingRate,
  shouldRefreshCheckoutOrderWithUpdate,
} from '@/lib/checkout/utils/shipping/shipping-rate-selection'

import type { CheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'
import {
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from './checkout-session.server'
import type { CheckoutMarket } from './checkout-session.server'

export async function readCheckoutOrderState({
  cartId,
  cartToken,
  market,
  refreshWithUpdate = false,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  refreshWithUpdate?: boolean
}): Promise<CheckoutOrder | null> {
  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(cartToken)
  let checkoutOrder: CheckoutOrder | null = null
  let shouldTryUpdateRefresh = refreshWithUpdate

  try {
    const cart = await client.carts.get(cartId, requestOptions)

    assertSpreeCartResourceMatchesMarket(cart, market)
    persistCheckoutCartCookies(cart, market, cartToken)
    checkoutOrder = mapSpreeCheckoutToOrder(cart)

    if (
      !refreshWithUpdate ||
      !shouldRefreshCheckoutOrderWithUpdate(checkoutOrder)
    ) {
      return checkoutOrder
    }
  } catch (cartError) {
    if (isCartMarketMismatchError(cartError)) {
      clearCartCookies()
      throw cartError
    }

    shouldTryUpdateRefresh =
      refreshWithUpdate || isRecoverableCartResponseError(cartError)
  }

  if (shouldTryUpdateRefresh) {
    try {
      // Spree can return an incomplete cart immediately after checkout
      // address mutations. A no-op update asks the server for the recalculated
      // checkout state, including fulfillments and delivery rates.
      const cart = await client.carts.update(cartId, {}, requestOptions)

      assertSpreeCartResourceMatchesMarket(cart, market)
      persistCheckoutCartCookies(cart, market, cartToken)

      return mapSpreeCheckoutToOrder(cart)
    } catch (updateError) {
      if (isCartMarketMismatchError(updateError)) {
        clearCartCookies()
        throw updateError
      }

      // Fall through to the order lookup below.
    }
  }

  try {
    const order = await client.orders.get(cartId, undefined, requestOptions)

    assertSpreeCartResourceMatchesMarket(order, market)
    persistCheckoutCartCookies(order, market, cartToken)

    return mapSpreeCheckoutToOrder(order)
  } catch (orderError) {
    if (isCartMarketMismatchError(orderError)) {
      clearCartCookies()
      throw orderError
    }

    return checkoutOrder
  }
}

export async function ensureCheckoutShippingRateForPayment({
  cartId,
  cartToken,
  market,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference
}): Promise<CheckoutOrder | null> {
  const checkoutOrder = await readCheckoutOrderState({
    cartId,
    cartToken,
    market,
    refreshWithUpdate: true,
  })

  if (!checkoutOrder) {
    return checkoutOrder
  }

  const nextRate = selectedShippingRate
    ? (checkoutOrder.shippingRates.find(
        (rate) =>
          rate.id === selectedShippingRate.id &&
          rate.fulfillmentId === selectedShippingRate.fulfillmentId,
      ) ??
      checkoutOrder.shippingRates.find(
        (rate) => rate.id === selectedShippingRate.id,
      ) ??
      (checkoutOrder.shippingRates.length === 1
        ? checkoutOrder.shippingRates[0]
        : null))
    : getSelectedCheckoutShippingRate(checkoutOrder)

  if (!nextRate) {
    return checkoutOrder
  }

  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(cartToken)

  try {
    // Re-selecting the same delivery rate is intentionally idempotent here:
    // Spree's fulfillment update also advances the checkout state after a
    // rate is selected. Address/billing updates can recalculate shipments, so
    // the payment boundary should assert the selected rate on the server.
    const updatedCart = await client.carts.fulfillments.update(
      cartId,
      nextRate.fulfillmentId,
      {
        selected_delivery_rate_id: nextRate.id,
      },
      requestOptions,
    )
    const updatedCartToken = updatedCart.token || cartToken

    persistCheckoutCartCookies(updatedCart, market, updatedCartToken)

    return (
      (await readCheckoutOrderState({
        cartId: updatedCart.id,
        cartToken: updatedCartToken,
        market,
        refreshWithUpdate: true,
      })) ?? mapSpreeCheckoutToOrder(updatedCart)
    )
  } catch {
    return checkoutOrder
  }
}
