import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'

import { buildExpressCheckoutPlaceholderAddress } from './checkout-express-address'
import { readExpressCheckoutErrorMessage } from './checkout-express-error.server'
import type { ExpressCheckoutOrderResult } from './checkout-express.types'
import { readCheckoutOrderState } from '../checkout-order-state.server'
import {
  assertCheckoutCartMatchesMarket,
  CheckoutCartSessionMismatchError,
  requireCheckoutCartCookieStateForCart,
  getCheckoutCartRequestOptions,
  withCheckoutCustomerSession,
  getCheckoutResourceToken,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

export const resolveExpressCheckoutShipping = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { expressCheckoutPartialAddressInputSchema } =
      await import('./checkout-express.schemas')
    const input = expressCheckoutPartialAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )
    const client = getServerSpreeClientForMarket(market)

    let validatedCartToken = cartToken
    let updatedCart
    try {
      updatedCart = await withCheckoutCustomerSession({
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
            {
              shipping_address: buildExpressCheckoutPlaceholderAddress(
                input.address,
              ),
            },
            getCheckoutCartRequestOptions(
              validatedCartToken,
              customerToken ?? '',
            ),
          )
        },
      })
    } catch (error) {
      return {
        error: readExpressCheckoutErrorMessage(
          error,
          'Unable to resolve express checkout shipping.',
        ),
        success: false,
      }
    }

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

    if (!refreshedCart) {
      return {
        error: 'Checkout is no longer available.',
        success: false,
      }
    }

    return {
      order: refreshedCart,
      success: true,
    }
  })

export const selectExpressCheckoutShippingRates = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { selectExpressCheckoutShippingRatesInputSchema } =
      await import('./checkout-express.schemas')
    const input = selectExpressCheckoutShippingRatesInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )
    const client = getServerSpreeClientForMarket(market)
    let updatedCartToken = cartToken
    let updatedCartId = input.cartId

    const validatedCartToken = await assertCheckoutCartMatchesMarket({
      cartId: updatedCartId,
      cartToken: updatedCartToken,
      client,
      market,
    })
    updatedCartToken = validatedCartToken || updatedCartToken

    for (const selection of input.selections) {
      const currentCartState = requireCheckoutCartCookieStateForCart(
        market,
        updatedCartId,
      )
      const expectedCurrentCartToken = currentCartState.cartToken
      const mutationCartToken = updatedCartToken

      let updatedCart
      try {
        updatedCart = await client.carts.fulfillments.update(
          updatedCartId,
          selection.fulfillmentId,
          {
            selected_delivery_rate_id: selection.rateId,
          },
          getCheckoutCartRequestOptions(mutationCartToken),
        )
      } catch (error) {
        return {
          error: readExpressCheckoutErrorMessage(
            error,
            'Unable to select express checkout shipping.',
          ),
          success: false,
        }
      }

      assertCartResourceIsCart(updatedCart)
      assertCartResourceMatchesId(updatedCart, updatedCartId)
      assertSpreeCartResourceMatchesMarket(updatedCart, market)
      void mapSpreeCheckoutToOrder(updatedCart, { locale: market.locale })
      requireCheckoutCartCookieStateForCart(market, updatedCartId)
      updatedCartId = updatedCart.id
      updatedCartToken = getCheckoutResourceToken(updatedCart, updatedCartToken)
      const didPersistCartCookies = persistCheckoutCartCookies(
        updatedCart,
        market,
        {
          expectedCartId: updatedCartId,
          expectedCurrentCartToken,
          fallbackToken: updatedCartToken,
        },
      )

      if (didPersistCartCookies === false) {
        throw new CheckoutCartSessionMismatchError()
      }
    }

    const refreshedCart = await readCheckoutOrderState({
      cartId: updatedCartId,
      cartToken: updatedCartToken,
      expectedCurrentCartToken: updatedCartToken,
      market,
      refreshWithUpdate: true,
    })

    if (!refreshedCart) {
      return {
        error: 'No shipping rates were available to select.',
        success: false,
      }
    }

    return {
      order: refreshedCart,
      success: true,
    }
  })
