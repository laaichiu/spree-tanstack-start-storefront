import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { mapSpreeCheckoutToOrder } from '@/lib/checkout/mappers/checkout.mapper'
import { clearCartCookies } from '@/lib/cookies/cart-cookie.server'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import { isRecoverableCartCookieError } from '@/lib/cart/utils/cart-errors'
import {
  buildCheckoutAddressUpdateParams,
  mapCheckoutAddressToParams,
} from '@/lib/checkout/utils/address/address-update'

import { readCheckoutOrderState } from '../checkout-order-state.server'
import {
  getCheckoutCartCookieStateForMarket,
  getCheckoutCartRequestOptions,
  persistCheckoutCartCookies,
} from '../checkout-session.server'

import type {
  UpdateCheckoutAddressInput,
  UpdateCheckoutBillingAddressInput,
} from './checkout-address.schemas'
import type { SelectCheckoutShippingRateInput } from '../shipping/checkout-shipping.schemas'

export const updateCheckoutAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as UpdateCheckoutAddressInput)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { updateCheckoutAddressInputSchema } =
      await import('./checkout-address.schemas')
    const input = updateCheckoutAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartId, cartToken } = getCheckoutCartCookieStateForMarket(market)
    const activeCartId = input.cartId ?? cartId

    if (!activeCartId) {
      throw new Error('Cart is not available.')
    }

    try {
      const client = getServerSpreeClientForMarket(market)
      const activeCart = await client.carts.get(
        activeCartId,
        getCheckoutCartRequestOptions(cartToken),
      )

      assertSpreeCartResourceMatchesMarket(activeCart, market)

      const updatedCart = await client.carts.update(
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
        getCheckoutCartRequestOptions(cartToken),
      )

      const updatedCartToken = updatedCart.token || cartToken

      persistCheckoutCartCookies(updatedCart, market, updatedCartToken)

      const refreshedCart = await readCheckoutOrderState({
        cartId: updatedCart.id,
        cartToken: updatedCartToken,
        market,
        refreshWithUpdate: true,
      })

      return refreshedCart ?? mapSpreeCheckoutToOrder(updatedCart)
    } catch (error) {
      if (isRecoverableCartCookieError(error) && !input.cartId) {
        clearCartCookies()
      }

      throw error
    }
  })

export const updateCheckoutBillingAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as UpdateCheckoutBillingAddressInput)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { updateCheckoutBillingAddressInputSchema } =
      await import('./checkout-address.schemas')
    const input = updateCheckoutBillingAddressInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)
    const payload = input.useShipping
      ? {
          use_shipping: true,
        }
      : {
          billing_address: mapCheckoutAddressToParams(input.billingAddress!),
          use_shipping: false,
        }
    const updatedCart = await getServerSpreeClientForMarket(
      market,
    ).carts.update(
      input.cartId,
      payload,
      getCheckoutCartRequestOptions(cartToken),
    )
    const updatedCartToken = updatedCart.token || cartToken

    persistCheckoutCartCookies(updatedCart, market, updatedCartToken)

    const refreshedCart = await readCheckoutOrderState({
      cartId: updatedCart.id,
      cartToken: updatedCartToken,
      market,
      refreshWithUpdate: true,
    })

    return refreshedCart ?? mapSpreeCheckoutToOrder(updatedCart)
  })

export const selectCheckoutShippingRate = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as SelectCheckoutShippingRateInput)
  .handler(async ({ data }): Promise<CheckoutOrder> => {
    const { selectCheckoutShippingRateInputSchema } =
      await import('../shipping/checkout-shipping.schemas')
    const input = selectCheckoutShippingRateInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)
    const updatedCart = await getServerSpreeClientForMarket(
      market,
    ).carts.fulfillments.update(
      input.cartId,
      input.fulfillmentId,
      {
        selected_delivery_rate_id: input.deliveryRateId,
      },
      getCheckoutCartRequestOptions(cartToken),
    )

    const updatedCartToken = updatedCart.token || cartToken

    persistCheckoutCartCookies(updatedCart, market, updatedCartToken)

    const refreshedCart = await readCheckoutOrderState({
      cartId: updatedCart.id,
      cartToken: updatedCartToken,
      market,
      refreshWithUpdate: true,
    })

    return refreshedCart ?? mapSpreeCheckoutToOrder(updatedCart)
  })
