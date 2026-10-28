import { z } from 'zod'

import { marketInputSchema } from '@/lib/market/utils/market-input'

export const customerAddressSchema = z.object({
  address1: z.string().trim().min(1, 'Street address is required.'),
  address2: z.string().trim(),
  city: z.string().trim().min(1, 'City is required.'),
  company: z.string().trim(),
  countryIso: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{2}$/, 'Enter a two-letter country code.'),
  firstName: z.string().trim().min(1, 'First name is required.'),
  isDefaultBilling: z.boolean(),
  isDefaultShipping: z.boolean(),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  phone: z.string().trim(),
  postalCode: z.string().trim().min(1, 'Postal code is required.'),
  stateAbbr: z.string().trim(),
  stateName: z.string().trim(),
})

export const customerAddressRequestSchema = customerAddressSchema.extend({
  market: marketInputSchema,
})

export const customerAddressUpdateRequestSchema = z.object({
  address: customerAddressSchema,
  id: z.string().trim().min(1),
  market: marketInputSchema,
})

export const customerAddressDeleteRequestSchema = z.object({
  id: z.string().trim().min(1),
  market: marketInputSchema,
})

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>
