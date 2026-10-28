import { z } from 'zod'

import { marketInputSchema } from '@/lib/market/utils/market-input'

export const customerLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export const customerLoginRequestSchema = customerLoginSchema.extend({
  market: marketInputSchema,
})

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>
export type CustomerLoginRequest = z.infer<typeof customerLoginRequestSchema>
