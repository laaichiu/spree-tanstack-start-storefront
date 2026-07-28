import { z } from 'zod'

export const customerRegisterSchema = z
  .object({
    acceptsEmailMarketing: z.boolean(),
    email: z.string().trim().email(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    password: z.string().min(8),
    passwordConfirmation: z.string().min(1),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Passwords do not match.',
    path: ['passwordConfirmation'],
  })

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>
