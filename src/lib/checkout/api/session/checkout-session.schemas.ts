import { z } from 'zod'

import { marketInputSchema } from '@/lib/market/utils/market-input'

export const checkoutCartIdSchema = z.string().trim().min(1)

export const checkoutMarketSchema = marketInputSchema

export const checkoutCartInputSchema = z.object({
  cartId: checkoutCartIdSchema,
  market: checkoutMarketSchema,
})

export type CheckoutCartInput = z.infer<typeof checkoutCartInputSchema>
