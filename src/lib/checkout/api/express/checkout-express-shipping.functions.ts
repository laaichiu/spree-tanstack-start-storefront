import { createServerFn } from '@tanstack/react-start'

import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { buildExpressCheckoutPlaceholderAddress } from './checkout-express-address'
import type {
  ExpressCheckoutPartialAddressInput,
  SelectExpressCheckoutShippingRatesInput,
} from './checkout-express.schemas'
import { readExpressCheckoutErrorMessage } from './checkout-express-error.server'
import type { ExpressCheckoutOrderResult } from './checkout-express.types'
import { readCheckoutOrderState } from '../checkout-order-state.server'
import {
  getCheckoutCartCookieStateForMarket,
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

export const resolveExpressCheckoutShipping = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as ExpressCheckoutPartialAddressInput)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { expressCheckoutPartialAddressInputSchema } =
      await import('./checkout-express.schemas')
    const input = expressCheckoutPartialAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)
    const client = getServerSpreeClientForMarket(market)
    const requestOptions = getCheckoutCartRequestOptions(cartToken)

    try {
      const updatedCart = await client.carts.update(
        input.cartId,
        {
          shipping_address: buildExpressCheckoutPlaceholderAddress(
            input.address,
          ),
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
          'Unable to resolve express checkout shipping.',
        ),
        success: false,
      }
    }
  })

export const selectExpressCheckoutShippingRates = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => data as SelectExpressCheckoutShippingRatesInput)
  .handler(async ({ data }): Promise<ExpressCheckoutOrderResult> => {
    const { selectExpressCheckoutShippingRatesInputSchema } =
      await import('./checkout-express.schemas')
    const input = selectExpressCheckoutShippingRatesInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)
    const client = getServerSpreeClientForMarket(market)
    let updatedCartToken = cartToken
    let updatedCartId = input.cartId

    try {
      for (const selection of input.selections) {
        const updatedCart = await client.carts.fulfillments.update(
          updatedCartId,
          selection.fulfillmentId,
          {
            selected_delivery_rate_id: selection.rateId,
          },
          getCheckoutCartRequestOptions(updatedCartToken),
        )

        updatedCartId = updatedCart.id
        updatedCartToken = updatedCart.token || updatedCartToken
        persistCheckoutCartCookies(updatedCart, market, updatedCartToken)
      }

      const refreshedCart = await readCheckoutOrderState({
        cartId: updatedCartId,
        cartToken: updatedCartToken,
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
    } catch (error) {
      return {
        error: readExpressCheckoutErrorMessage(
          error,
          'Unable to select express checkout shipping.',
        ),
        success: false,
      }
    }
  })
