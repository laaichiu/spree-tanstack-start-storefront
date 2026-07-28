import { z } from 'zod'

export const newsletterSubscriptionSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  redirectUrl: z.string().trim().url().optional(),
})

export type NewsletterSubscriptionInput = z.infer<
  typeof newsletterSubscriptionSchema
>

export const newsletterVerificationSchema = z.object({
  token: z.string().trim().min(1),
})

export type NewsletterVerificationInput = z.infer<
  typeof newsletterVerificationSchema
>
