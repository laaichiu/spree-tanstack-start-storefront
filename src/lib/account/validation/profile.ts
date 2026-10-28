import { z } from 'zod'

import { marketInputSchema } from '@/lib/market/utils/market-input'

export const customerProfileUpdateSchema = z.object({
  acceptsEmailMarketing: z.boolean(),
  email: z.string().trim().email(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  phone: z.string().trim(),
})

export const customerProfileUpdateRequestSchema =
  customerProfileUpdateSchema.extend({
    market: marketInputSchema,
  })

export type CustomerProfileUpdateInput = z.infer<
  typeof customerProfileUpdateSchema
>
