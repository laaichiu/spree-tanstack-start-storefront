import { z } from 'zod'

export const customerProfileUpdateSchema = z.object({
  acceptsEmailMarketing: z.boolean(),
  email: z.string().trim().email(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  phone: z.string().trim(),
})

export type CustomerProfileUpdateInput = z.infer<
  typeof customerProfileUpdateSchema
>
