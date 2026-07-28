import { z } from 'zod'

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

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>
