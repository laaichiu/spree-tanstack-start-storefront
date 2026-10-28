import { z } from 'zod'

import { marketInputSchema } from '@/lib/market/utils/market-input'

export const customerPasswordResetSchema = z.object({
  email: z.string().trim().email(),
})

export type CustomerPasswordResetInput = z.infer<
  typeof customerPasswordResetSchema
>

export const customerPasswordResetRequestSchema =
  customerPasswordResetSchema.extend({
    market: marketInputSchema,
  })

export type CustomerPasswordResetRequest = z.infer<
  typeof customerPasswordResetRequestSchema
>

export const customerPasswordResetConfirmSchema = z
  .object({
    password: z.string().min(8),
    passwordConfirmation: z.string().min(1),
    token: z.string().trim().min(1),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match.',
    path: ['passwordConfirmation'],
  })

export const customerPasswordResetConfirmRequestSchema =
  customerPasswordResetConfirmSchema.extend({
    market: marketInputSchema,
  })

export type CustomerPasswordResetConfirmInput = z.infer<
  typeof customerPasswordResetConfirmSchema
>
export type CustomerPasswordResetConfirmRequest = z.infer<
  typeof customerPasswordResetConfirmRequestSchema
>
