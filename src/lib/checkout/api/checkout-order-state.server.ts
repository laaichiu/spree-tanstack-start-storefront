import '@tanstack/react-start/server-only'

import {
  getSelectedCheckoutShippingRate,
  shouldRefreshCheckoutOrderWithUpdate,
} from '@/lib/checkout/contracts'
import type { Cart as SpreeCart } from '@spree/sdk'
import { isOrderGroup } from '@spree/sdk'
import { assertCompletedCheckoutResourceMatchesMarket } from '@/lib/checkout/api/completion/checkout-completed-resource.server'

import type {
  CheckoutOrder,
  CheckoutShippingRateReference,
} from '@/lib/checkout/contracts'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  assertSpreeCartResourceMatchesMarket,
  isCartMarketMismatchError,
} from '@/lib/cart/utils/cart-market'
import { isRecoverableCartResponseError } from '@/lib/cart/utils/cart-errors'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
  isCartResourceIdentityMismatchError,
  isCartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'
import { isSpreeCompletedOrder } from '@/lib/checkout/utils/payment/payment-completion'
import { lookupCheckoutOrderWithCartCredentials } from '@/lib/checkout/api/completion/checkout-order-lookup'
import {
  assertCheckoutOrderResourceMatchesRequestedId,
  isCheckoutOrderResourceIdentityMismatchError,
} from '@/lib/checkout/utils/order-resource-identity'

import {
  clearCheckoutCartCookiesIfOwnedByCart,
  CheckoutCartSessionMismatchError,
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from './checkout-session.server'
import type { CheckoutMarket } from './checkout-session.server'

type CheckoutOrderStateReadResult = {
  cartToken?: string
  persistedCartToken?: string
  checkoutOrder: CheckoutOrder | null
}

function readCartToken(resource: object, fallbackToken?: string) {
  const token = 'token' in resource ? resource.token : undefined
  const normalizedToken = typeof token === 'string' ? token.trim() : undefined
  const normalizedFallbackToken = fallbackToken?.trim()

  return normalizedToken || normalizedFallbackToken || undefined
}

function mapAndPersistCheckoutCart({
  cart,
  cartCookieId,
  cartId,
  currentCartTokenGuard,
  market,
  persistedCartToken,
  requestCartToken,
}: {
  cart: SpreeCart
  cartCookieId?: string
  cartId: string
  currentCartTokenGuard?: string
  market: CheckoutMarket
  persistedCartToken?: string
  requestCartToken?: string
}): CheckoutOrderStateReadResult {
  assertCartResourceIsCart(cart)
  assertCartResourceMatchesId(cart, cartId)
  assertSpreeCartResourceMatchesMarket(cart, market)

  const cartToken = readCartToken(cart, requestCartToken)

  if (isSpreeCompletedOrder(cart)) {
    clearCheckoutCartCookiesIfOwnedByCart(
      cartId,
      cartCookieId,
      persistedCartToken,
    )

    return { cartToken, persistedCartToken, checkoutOrder: null }
  }

  const checkoutOrder = mapSpreeCheckoutToOrder(cart, { locale: market.locale })
  const didPersistCartCookies = persistCheckoutCartCookies(cart, market, {
    expectedCartId: cartId,
    expectedCurrentCartToken: currentCartTokenGuard,
    fallbackToken: cartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }

  return {
    cartToken,
    persistedCartToken: cartToken,
    checkoutOrder,
  }
}

export async function readCheckoutOrderStateWithToken({
  cartId,
  cartToken,
  cartCookieId,
  customerToken,
  expectedCurrentCartToken,
  persistedCartToken: persistedCartTokenInput,
  market,
  refreshWithUpdate = false,
}: {
  cartId: string
  cartToken?: string
  cartCookieId?: string
  customerToken?: string
  expectedCurrentCartToken?: string
  persistedCartToken?: string
  market: CheckoutMarket
  refreshWithUpdate?: boolean
}): Promise<CheckoutOrderStateReadResult> {
  const client = getServerSpreeClientForMarket(market)
  let activeCartToken = cartToken
  const currentCartTokenGuard = expectedCurrentCartToken ?? cartToken
  let persistedCartToken = persistedCartTokenInput ?? currentCartTokenGuard
  let checkoutOrder: CheckoutOrder | null = null
  let shouldTryUpdateRefresh = refreshWithUpdate

  const cartReadResult = await client.carts
    .get(cartId, getCheckoutCartRequestOptions(activeCartToken, customerToken))
    .then(
      (response) => ({ ok: true as const, response }),
      (error: unknown) => ({ ok: false as const, error }),
    )

  if (cartReadResult.ok) {
    const cartState = mapAndPersistCheckoutCart({
      cart: cartReadResult.response,
      cartCookieId,
      cartId,
      currentCartTokenGuard,
      market,
      persistedCartToken,
      requestCartToken: activeCartToken,
    })
    activeCartToken = cartState.cartToken
    persistedCartToken = cartState.persistedCartToken
    checkoutOrder = cartState.checkoutOrder

    if (!checkoutOrder) {
      return cartState
    }

    if (
      !refreshWithUpdate ||
      !shouldRefreshCheckoutOrderWithUpdate(checkoutOrder)
    ) {
      return {
        cartToken: activeCartToken,
        persistedCartToken,
        checkoutOrder,
      }
    }
  } else {
    const cartError = cartReadResult.error

    if (
      isCartResourceIdentityMismatchError(cartError) ||
      isCartResourceTypeMismatchError(cartError)
    ) {
      throw cartError
    }

    if (isCartMarketMismatchError(cartError)) {
      clearCheckoutCartCookiesIfOwnedByCart(
        cartId,
        cartCookieId,
        persistedCartToken,
      )
      throw cartError
    }

    shouldTryUpdateRefresh =
      refreshWithUpdate || isRecoverableCartResponseError(cartError)
  }

  if (shouldTryUpdateRefresh) {
    // Spree can return an incomplete cart immediately after checkout
    // address mutations. A no-op update asks the server for the recalculated
    // checkout state, including fulfillments and delivery rates.
    const requestCartToken = activeCartToken
    const cartUpdateResult = await client.carts
      .update(
        cartId,
        {},
        getCheckoutCartRequestOptions(requestCartToken, customerToken),
      )
      .then(
        (response) => ({ ok: true as const, response }),
        (error: unknown) => ({ ok: false as const, error }),
      )

    if (cartUpdateResult.ok) {
      return mapAndPersistCheckoutCart({
        cart: cartUpdateResult.response,
        cartCookieId,
        cartId,
        currentCartTokenGuard,
        market,
        persistedCartToken,
        requestCartToken: activeCartToken,
      })
    } else {
      // Fall through to the order lookup below only when the Spree update
      // request itself failed. Response validation, mapping, and cookie
      // persistence errors must remain visible to their owning boundary.
    }
  }

  let order
  try {
    const requestCartToken = activeCartToken
    order = await lookupCheckoutOrderWithCartCredentials({
      cartId,
      cartToken: requestCartToken,
      client,
    })
  } catch (orderError) {
    if (isCheckoutOrderResourceIdentityMismatchError(orderError)) {
      throw orderError
    }

    if (isCartMarketMismatchError(orderError)) {
      clearCheckoutCartCookiesIfOwnedByCart(
        cartId,
        cartCookieId,
        persistedCartToken,
      )
      throw orderError
    }

    return {
      cartToken: activeCartToken,
      persistedCartToken,
      checkoutOrder: null,
    }
  }

  if (!order) {
    return {
      cartToken: activeCartToken,
      persistedCartToken,
      checkoutOrder: null,
    }
  }

  assertCheckoutOrderResourceMatchesRequestedId(order, cartId)

  try {
    assertCompletedCheckoutResourceMatchesMarket(order, market)
  } catch (orderError) {
    if (isCartMarketMismatchError(orderError)) {
      clearCheckoutCartCookiesIfOwnedByCart(
        cartId,
        cartCookieId,
        persistedCartToken,
      )
    }

    throw orderError
  }

  activeCartToken = readCartToken(order, activeCartToken)

  if (isSpreeCompletedOrder(order)) {
    clearCheckoutCartCookiesIfOwnedByCart(
      cartId,
      cartCookieId,
      persistedCartToken,
    )

    return {
      cartToken: activeCartToken,
      persistedCartToken,
      checkoutOrder: null,
    }
  }

  if (isOrderGroup(order)) {
    throw new Error('The checkout order group is not completed.')
  }

  const mappedCheckoutOrder = mapSpreeCheckoutToOrder(order, {
    locale: market.locale,
    cartIdOverride: cartId,
  })

  const didPersistCartCookies = persistCheckoutCartCookies(order, market, {
    cartIdOverride: cartId,
    expectedCurrentCartToken: currentCartTokenGuard,
    fallbackToken: activeCartToken,
  })

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }
  persistedCartToken = activeCartToken

  return {
    cartToken: activeCartToken,
    persistedCartToken,
    checkoutOrder: mappedCheckoutOrder,
  }
}

export async function readCheckoutOrderState(
  input: Parameters<typeof readCheckoutOrderStateWithToken>[0],
): Promise<CheckoutOrder | null> {
  const { checkoutOrder } = await readCheckoutOrderStateWithToken(input)

  return checkoutOrder
}

export function requireActiveCheckoutOrder(
  checkoutOrder: CheckoutOrder | null,
): CheckoutOrder {
  if (!checkoutOrder) {
    throw new Error('Checkout is no longer available.')
  }

  return checkoutOrder
}

export type CheckoutShippingRatePreparation = {
  cartToken?: string
  persistedCartToken?: string
  checkoutOrder: CheckoutOrder | null
}

export async function ensureCheckoutShippingRateForPaymentWithToken({
  cartId,
  cartToken,
  customerToken,
  expectedCurrentCartToken,
  market,
  onCartTokenAvailable,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  customerToken?: string
  expectedCurrentCartToken?: string
  market: CheckoutMarket
  onCartTokenAvailable?: (cartToken: string) => void
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<CheckoutShippingRatePreparation> {
  const initialState = await readCheckoutOrderStateWithToken({
    cartId,
    cartToken,
    customerToken,
    expectedCurrentCartToken,
    market,
    refreshWithUpdate: true,
  })
  const checkoutOrder = initialState.checkoutOrder
  const activeCartToken = initialState.cartToken
  let persistedCartToken = initialState.persistedCartToken
  const currentCartTokenGuard = expectedCurrentCartToken ?? cartToken

  if (checkoutOrder && persistedCartToken) {
    onCartTokenAvailable?.(persistedCartToken)
  }

  if (!checkoutOrder) {
    return {
      cartToken: activeCartToken,
      persistedCartToken,
      checkoutOrder: null,
    }
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
    return {
      cartToken: activeCartToken,
      persistedCartToken,
      checkoutOrder,
    }
  }

  const client = getServerSpreeClientForMarket(market)
  const requestOptions = getCheckoutCartRequestOptions(
    activeCartToken,
    customerToken,
  )

  // Re-selecting the same delivery rate is intentionally idempotent here:
  // Spree's fulfillment update also advances the checkout state after a
  // rate is selected. Address/billing updates can recalculate shipments, so
  // the payment boundary must not continue with the old order when this
  // assertion fails. Let the existing payment/completion recovery map the
  // failure to a safe, recoverable result.
  const updatedCart = await client.carts.fulfillments.update(
    cartId,
    nextRate.fulfillmentId,
    {
      selected_delivery_rate_id: nextRate.id,
    },
    requestOptions,
  )

  assertCartResourceIsCart(updatedCart)
  assertCartResourceMatchesId(updatedCart, cartId)
  assertSpreeCartResourceMatchesMarket(updatedCart, market)

  const updatedCartToken = readCartToken(updatedCart, activeCartToken)

  if (isSpreeCompletedOrder(updatedCart)) {
    clearCheckoutCartCookiesIfOwnedByCart(cartId, undefined, persistedCartToken)
    return {
      cartToken: updatedCartToken,
      persistedCartToken,
      checkoutOrder: null,
    }
  }

  // The fulfillment mutation response is used for credential/session
  // continuity before the follow-up checkout read. Validate that it can cross
  // the normalized projection boundary before persisting its rotated token.
  void mapSpreeCheckoutToOrder(updatedCart, { locale: market.locale })

  const didPersistCartCookies = persistCheckoutCartCookies(
    updatedCart,
    market,
    {
      expectedCartId: cartId,
      expectedCurrentCartToken: currentCartTokenGuard,
      fallbackToken: updatedCartToken,
    },
  )

  if (didPersistCartCookies === false) {
    throw new CheckoutCartSessionMismatchError()
  }
  persistedCartToken = updatedCartToken

  if (updatedCartToken) {
    onCartTokenAvailable?.(updatedCartToken)
  }

  const refreshedState = await readCheckoutOrderStateWithToken({
    cartId: updatedCart.id,
    cartToken: updatedCartToken,
    customerToken,
    expectedCurrentCartToken: currentCartTokenGuard,
    persistedCartToken,
    market,
    refreshWithUpdate: true,
  })

  if (refreshedState.persistedCartToken) {
    onCartTokenAvailable?.(refreshedState.persistedCartToken)
  }

  return {
    cartToken: refreshedState.cartToken,
    persistedCartToken: refreshedState.persistedCartToken,
    checkoutOrder: refreshedState.checkoutOrder,
  }
}

export async function ensureCheckoutShippingRateForPayment({
  cartId,
  cartToken,
  expectedCurrentCartToken,
  market,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  expectedCurrentCartToken?: string
  market: CheckoutMarket
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<CheckoutOrder | null> {
  const { checkoutOrder } = await ensureCheckoutShippingRateForPaymentWithToken(
    {
      cartId,
      cartToken,
      market,
      expectedCurrentCartToken,
      selectedShippingRate,
    },
  )

  return checkoutOrder
}
