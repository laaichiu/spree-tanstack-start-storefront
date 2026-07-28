import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

import type {
  CompleteCheckoutOrderInput,
  ConfirmCheckoutPaymentInput,
} from './checkout-completion.schemas'
import {
  confirmCheckoutPaymentAndCompleteOrderOnServer,
  completeCheckoutOrderOnServer,
} from './checkout-order-completion.server'
import { getCheckoutCartCookieStateForMarket } from '../checkout-session.server'

export const completeCheckoutOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as CompleteCheckoutOrderInput)
  .handler(async ({ data }) => {
    const { completeCheckoutOrderInputSchema } =
      await import('./checkout-completion.schemas')
    const input = completeCheckoutOrderInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

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
  .validator((data: unknown) => data as ConfirmCheckoutPaymentInput)
  .handler(async ({ data }) => {
    const { confirmCheckoutPaymentInputSchema } =
      await import('./checkout-completion.schemas')
    const input = confirmCheckoutPaymentInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return confirmCheckoutPaymentAndCompleteOrderOnServer({
      ...input,
      cartToken,
      market,
    })
  })
