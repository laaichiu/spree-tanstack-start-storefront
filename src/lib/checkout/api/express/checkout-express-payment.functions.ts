import { createServerFn } from '@tanstack/react-start'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import type { PrepareExpressCheckoutPaymentInput } from './checkout-express.schemas'
import { readExpressCheckoutErrorMessage } from './checkout-express-error.server'
import type { ExpressCheckoutOrderResult } from './checkout-express.types'
import { readCheckoutOrderState } from '../checkout-order-state.server'
import {
  getCheckoutCartCookieStateForMarket,
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

export const prepareExpressCheckoutPayment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as PrepareExpressCheckoutPaymentInput)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { prepareExpressCheckoutPaymentInputSchema } =
      await import('./checkout-express.schemas')
    const input = prepareExpressCheckoutPaymentInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)
    const client = getServerSpreeClientForMarket(market)
    const requestOptions = getCheckoutCartRequestOptions(cartToken)

    try {
      const updatedCart = await client.carts.update(
        input.cartId,
        {
          billing_address: input.billingAddress,
          email: input.email,
          shipping_address: input.shippingAddress,
          use_shipping: false,
        },
        requestOptions,
      )
      const updatedCartToken = updatedCart.token || cartToken

      persistCheckoutCartCookies(updatedCart, market, updatedCartToken)

      const refreshedCart = await readCheckoutOrderState({
        cartId: updatedCart.id,
        cartToken: updatedCartToken,
        market,
        refreshWithUpdate: true,
      })

      return {
        order: refreshedCart ?? mapSpreeCheckoutToOrder(updatedCart),
        success: true,
      }
    } catch (error) {
      return {
        error: readExpressCheckoutErrorMessage(
          error,
          'Unable to prepare express checkout payment.',
        ),
        success: false,
      }
    }
  })
