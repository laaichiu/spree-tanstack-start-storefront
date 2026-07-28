import { z } from 'zod'

import { checkoutMarketSchema } from '../session/checkout-session.schemas'

export const selectCheckoutShippingRateInputSchema = z.object({
  cartId: z.string().trim().min(1),
  deliveryRateId: z.string().trim().min(1),
  fulfillmentId: z.string().trim().min(1),
  market: checkoutMarketSchema,
})

export const checkoutShippingRateReferenceSchema = z
  .object({
    deliveryMethodId: z.string().trim().min(1).optional(),
    fulfillmentId: z.string().trim().min(1),
    id: z.string().trim().min(1),
  })
  .strict()
  .optional()

export type SelectCheckoutShippingRateInput = z.infer<
  typeof selectCheckoutShippingRateInputSchema
>
