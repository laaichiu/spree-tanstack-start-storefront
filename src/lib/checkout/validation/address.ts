import { z } from 'zod'

const textValue = z.string().trim().catch('')

function requiredText(message: string) {
  return textValue.pipe(z.string().min(1, message))
}

const checkoutAddressFields = {
  address1: requiredText('Enter an address.'),
  address2: textValue,
  city: requiredText('Enter a city.'),
  company: textValue,
  countryIso: textValue.pipe(
    z.string().regex(/^[a-zA-Z]{2}$/, 'Select a valid country.'),
  ),
  firstName: requiredText('Enter a first name.'),
  lastName: requiredText('Enter a last name.'),
  phone: requiredText('Enter a phone number.'),
  postalCode: requiredText('Enter a ZIP/postal code.'),
  stateAbbr: textValue,
  stateName: textValue,
}

function requireStateOrProvince<
  TSchema extends z.ZodObject<{
    stateAbbr: typeof textValue
    stateName: typeof textValue
  }>,
>(schema: TSchema) {
  return schema.superRefine((data, context) => {
    if (!data.stateAbbr.trim() && !data.stateName.trim()) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a state / province.',
        path: ['stateName'],
      })
    }
  })
}

export const checkoutBillingAddressSchema = requireStateOrProvince(
  z.object({
    ...checkoutAddressFields,
    phone: textValue,
  }),
)

export const checkoutAddressSchema = requireStateOrProvince(
  z.object({
    ...checkoutAddressFields,
    email: requiredText('Enter an email.').pipe(
      z.string().email('Enter a valid email address.'),
    ),
  }),
)

export type CheckoutBillingAddressInput = z.infer<
  typeof checkoutBillingAddressSchema
>
export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>
