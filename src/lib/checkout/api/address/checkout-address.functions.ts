import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { clearCartCookiesIfCurrentCartMatches } from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { isRecoverableCartCookieError } from '@/lib/cart/utils/cart-errors'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import {
  buildCheckoutAddressUpdateParams,
  mapCheckoutAddressToParams,
} from './checkout-address.mapper'

import {
  readCheckoutOrderState,
  requireActiveCheckoutOrder,
} from '../checkout-order-state.server'
import {
  CheckoutCartSessionMismatchError,
  getCheckoutCartCookieStateForMarket,
  requireCheckoutCartCookieStateForCart,
  getCheckoutCartRequestOptions,
  withCheckoutCustomerSession,
  getCheckoutResourceToken,
  assertCheckoutCartMatchesMarket,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

export const updateCheckoutAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { updateCheckoutAddressInputSchema } =
      await import('./checkout-address.schemas')
    const input = updateCheckoutAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartId, cartToken } = input.cartId
      ? requireCheckoutCartCookieStateForCart(market, input.cartId)
      : getCheckoutCartCookieStateForMarket(market)
    const activeCartId = input.cartId ?? cartId

    if (!activeCartId) {
      throw new Error('Cart is not available.')
    }

    let cleanupCartToken = cartToken
    let validatedCartToken = cartToken

    try {
      const client = getServerSpreeClientForMarket(market)
      const updatedCart = await withCheckoutCustomerSession({
        client,
        operation: async (customerToken) => {
          validatedCartToken = await assertCheckoutCartMatchesMarket({
            cartId: activeCartId,
            cartToken,
            client,
            customerToken,
            market,
          })
          cleanupCartToken = validatedCartToken

          return client.carts.update(
            activeCartId,
            buildCheckoutAddressUpdateParams(
              input.address
                ? {
                    address: input.address,
                    email: input.email,
                  }
                : {
                    email: input.email,
                    shippingAddressId: input.shippingAddressId!,
                  },
            ),
            getCheckoutCartRequestOptions(
              validatedCartToken,
              customerToken ?? '',
            ),
          )
        },
      })
      assertCartResourceIsCart(updatedCart)
      assertCartResourceMatchesId(updatedCart, activeCartId)
      assertSpreeCartResourceMatchesMarket(updatedCart, market)
      void mapSpreeCheckoutToOrder(updatedCart, { locale: market.locale })

      const updatedCartToken = getCheckoutResourceToken(
        updatedCart,
        validatedCartToken,
      )

      const didPersistCartCookies = persistCheckoutCartCookies(
        updatedCart,
        market,
        {
          expectedCartId: activeCartId,
          expectedCurrentCartToken: cartToken,
          fallbackToken: validatedCartToken,
        },
      )

      if (didPersistCartCookies === false) {
        throw new CheckoutCartSessionMismatchError()
      }

      const refreshedCart = await readCheckoutOrderState({
        cartId: updatedCart.id,
        cartToken: updatedCartToken,
        expectedCurrentCartToken: cartToken,
        market,
        refreshWithUpdate: true,
      })

      return requireActiveCheckoutOrder(refreshedCart)
    } catch (error) {
      if (isRecoverableCartCookieError(error) && !input.cartId) {
        clearCartCookiesIfCurrentCartMatches(activeCartId, cleanupCartToken)
      }

      throw error
    }
  })

export const updateCheckoutBillingAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { updateCheckoutBillingAddressInputSchema } =
      await import('./checkout-address.schemas')
    const input = updateCheckoutBillingAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )
    const client = getServerSpreeClientForMarket(market)
    const payload = input.useShipping
      ? {
          use_shipping: true,
        }
      : {
          billing_address: mapCheckoutAddressToParams(input.billingAddress!),
          use_shipping: false,
        }
    let validatedCartToken = cartToken
    const updatedCart = await withCheckoutCustomerSession({
      client,
      operation: async (customerToken) => {
        validatedCartToken = await assertCheckoutCartMatchesMarket({
          cartId: input.cartId,
          cartToken,
          client,
          customerToken,
          market,
        })

        return client.carts.update(
          input.cartId,
          payload,
          getCheckoutCartRequestOptions(
            validatedCartToken,
            customerToken ?? '',
          ),
        )
      },
    })
    assertCartResourceIsCart(updatedCart)
    assertCartResourceMatchesId(updatedCart, input.cartId)
    assertSpreeCartResourceMatchesMarket(updatedCart, market)
    void mapSpreeCheckoutToOrder(updatedCart, { locale: market.locale })
    const updatedCartToken = getCheckoutResourceToken(
      updatedCart,
      validatedCartToken,
    )

    const didPersistCartCookies = persistCheckoutCartCookies(
      updatedCart,
      market,
      {
        expectedCartId: input.cartId,
        expectedCurrentCartToken: cartToken,
        fallbackToken: validatedCartToken,
      },
    )

    if (didPersistCartCookies === false) {
      throw new CheckoutCartSessionMismatchError()
    }

    const refreshedCart = await readCheckoutOrderState({
      cartId: updatedCart.id,
      cartToken: updatedCartToken,
      expectedCurrentCartToken: cartToken,
      market,
      refreshWithUpdate: true,
    })

    return requireActiveCheckoutOrder(refreshedCart)
  })

export const selectCheckoutShippingRate = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { selectCheckoutShippingRateInputSchema } =
      await import('../shipping/checkout-shipping.schemas')
    const input = selectCheckoutShippingRateInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )
    const client = getServerSpreeClientForMarket(market)

    const validatedCartToken = await assertCheckoutCartMatchesMarket({
      cartId: input.cartId,
      cartToken,
      client,
      market,
    })

    const updatedCart = await client.carts.fulfillments.update(
      input.cartId,
      input.fulfillmentId,
      {
        selected_delivery_rate_id: input.deliveryRateId,
      },
      getCheckoutCartRequestOptions(validatedCartToken),
    )
    assertCartResourceIsCart(updatedCart)
    assertCartResourceMatchesId(updatedCart, input.cartId)
    assertSpreeCartResourceMatchesMarket(updatedCart, market)
    void mapSpreeCheckoutToOrder(updatedCart, { locale: market.locale })

    const updatedCartToken = getCheckoutResourceToken(
      updatedCart,
      validatedCartToken,
    )

    const didPersistCartCookies = persistCheckoutCartCookies(
      updatedCart,
      market,
      {
        expectedCartId: input.cartId,
        expectedCurrentCartToken: cartToken,
        fallbackToken: validatedCartToken,
      },
    )

    if (didPersistCartCookies === false) {
      throw new CheckoutCartSessionMismatchError()
    }

    const refreshedCart = await readCheckoutOrderState({
      cartId: updatedCart.id,
      cartToken: updatedCartToken,
      expectedCurrentCartToken: cartToken,
      market,
      refreshWithUpdate: true,
    })

    return requireActiveCheckoutOrder(refreshedCart)
  })
