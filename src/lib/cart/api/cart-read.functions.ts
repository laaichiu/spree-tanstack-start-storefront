import { createServerFn } from '@tanstack/react-start'

import { isCartResourceId } from '../utils/cart-identity'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

export const getCart = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        cartId: z
          .string()
          .trim()
          .refine(isCartResourceId, 'Expected a non-empty Cart resource id.')
          .optional(),
        market: marketInputSchema,
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const { getCartForMarket } = await import('./cart-read.server')

    return getCartForMarket(market, input.cartId)
  })
