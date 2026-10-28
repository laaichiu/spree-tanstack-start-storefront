import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { readCheckoutOrderState } from './checkout-order-state.server'
import { readCompletedCheckoutOrder } from './completion/checkout-completed-order.server'
import { requireCheckoutCartCookieStateForCart } from './checkout-session.server'

export const getCheckoutCart = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<CheckoutOrder | null> => {
    const { checkoutCartInputSchema } =
      await import('./session/checkout-session.schemas')
    const input = checkoutCartInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartId: cartCookieId, cartToken } =
      requireCheckoutCartCookieStateForCart(market, input.cartId)

    return readCheckoutOrderState({
      cartId: input.cartId,
      cartCookieId,
      cartToken,
      market,
    })
  })

export const getCompletedCheckoutOrder = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<CheckoutOrder | null> => {
    const { completedCheckoutOrderInputSchema } =
      await import('./completion/checkout-completion.schemas')
    const input = completedCheckoutOrderInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)

    return readCompletedCheckoutOrder({
      market,
      orderId: input.orderId,
    })
  })
