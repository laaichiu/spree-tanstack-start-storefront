import { z } from 'zod'

export const customerLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>
