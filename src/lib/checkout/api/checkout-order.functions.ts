import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { readCheckoutOrderState } from './checkout-order-state.server'
import { readCompletedCheckoutOrder } from './completion/checkout-completed-order.server'
import { getCheckoutCartCookieStateForMarket } from './checkout-session.server'

import type { CompletedCheckoutOrderInput } from './completion/checkout-completion.schemas'
import type { CheckoutCartInput } from './session/checkout-session.schemas'

export const getCheckoutCart = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as CheckoutCartInput)
  .handler(async ({ data }): Promise<CheckoutOrder | null> => {
    const { checkoutCartInputSchema } =
      await import('./session/checkout-session.schemas')
    const input = checkoutCartInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return readCheckoutOrderState({
      cartId: input.cartId,
      cartToken,
      market,
    })
  })

export const getCompletedCheckoutOrder = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as CompletedCheckoutOrderInput)
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
