import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  assertCartResourceIsCart,
  assertCartResourceMatchesId,
} from '@/lib/cart/utils/cart-identity'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'

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

export const prepareExpressCheckoutPayment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { prepareExpressCheckoutPaymentInputSchema } =
      await import('./checkout-express.schemas')
    const input = prepareExpressCheckoutPaymentInputSchema.parse(data)
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
              billing_address: input.billingAddress,
              email: input.email,
              shipping_address: input.shippingAddress,
              use_shipping: false,
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
          'Unable to prepare express checkout payment.',
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
