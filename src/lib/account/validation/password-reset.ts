import { z } from 'zod'

export const customerPasswordResetSchema = z.object({
  email: z.string().trim().email(),
})

export type CustomerPasswordResetInput = z.infer<
  typeof customerPasswordResetSchema
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

export type CustomerPasswordResetConfirmInput = z.infer<
  typeof customerPasswordResetConfirmSchema
>
