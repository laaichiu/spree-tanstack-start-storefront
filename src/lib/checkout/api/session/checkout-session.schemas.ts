import { z } from 'zod'

import { isCartResourceId } from '@/lib/cart/utils/cart-identity'
import { marketInputSchema } from '@/lib/market/utils/market-input'

export const checkoutCartIdSchema = z
  .string()
  .trim()
  .refine(isCartResourceId, 'Expected a non-empty Cart resource id.')

export const checkoutMarketSchema = marketInputSchema

export const checkoutCartInputSchema = z.object({
  cartId: checkoutCartIdSchema,
  market: checkoutMarketSchema,
})

export type CheckoutCartInput = z.infer<typeof checkoutCartInputSchema>
