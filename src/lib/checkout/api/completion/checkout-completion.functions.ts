import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

import {
  confirmCheckoutPaymentAndCompleteOrderOnServer,
  completeCheckoutOrderOnServer,
} from './checkout-order-completion.server'
import {
  getCheckoutCartCookieStateForMarket,
  requireCheckoutCartCookieStateForCart,
} from '../checkout-session.server'

export const completeCheckoutOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { completeCheckoutOrderInputSchema } =
      await import('./checkout-completion.schemas')
    const input = completeCheckoutOrderInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )

    return completeCheckoutOrderOnServer({
      cartId: input.cartId,
      cartToken,
      market,
      selectedShippingRate: input.selectedShippingRate,
    })
  })

export const confirmCheckoutPaymentAndCompleteOrder = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { confirmCheckoutPaymentInputSchema } =
      await import('./checkout-completion.schemas')
    const input = confirmCheckoutPaymentInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(
      market,
      input.cartId,
    )

    return confirmCheckoutPaymentAndCompleteOrderOnServer({
      ...input,
      cartToken,
      market,
    })
  })
