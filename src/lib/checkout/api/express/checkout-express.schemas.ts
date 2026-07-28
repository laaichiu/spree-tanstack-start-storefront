import type { AddressParams } from '@spree/sdk'
import { z } from 'zod'

import { checkoutCartInputSchema } from '../session/checkout-session.schemas'

export const expressCheckoutPartialAddressInputSchema =
  checkoutCartInputSchema.extend({
    address: z.object({
      city: z.string().trim().min(1),
      countryIso: z
        .string()
        .trim()
        .regex(/^[a-zA-Z]{2}$/),
      postalCode: z.string().trim().min(1),
      stateAbbr: z.string().trim().optional(),
      stateName: z.string().trim().optional(),
    }),
  })

export type ExpressCheckoutPartialAddress = z.infer<
  typeof expressCheckoutPartialAddressInputSchema
>['address']
export type ExpressCheckoutPartialAddressInput = z.infer<
  typeof expressCheckoutPartialAddressInputSchema
>

export const expressCheckoutRateSelectionSchema = z.object({
  fulfillmentId: z.string().trim().min(1),
  rateId: z.string().trim().min(1),
})

export const selectExpressCheckoutShippingRatesInputSchema =
  checkoutCartInputSchema.extend({
    selections: z.array(expressCheckoutRateSelectionSchema).min(1),
  })

export const expressCheckoutAddressParamsSchema: z.ZodType<AddressParams> = z
  .object({
    address1: z.string().trim().min(1),
    address2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    company: z.string().trim().optional(),
    country_iso: z
      .string()
      .trim()
      .regex(/^[a-zA-Z]{2}$/),
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    phone: z.string().trim().optional(),
    postal_code: z.string().trim().min(1),
    quick_checkout: z.literal(true).optional(),
    state_abbr: z.string().trim().optional(),
    state_name: z.string().trim().optional(),
  })
  .transform((address) => ({
    ...address,
    country_iso: address.country_iso.toUpperCase(),
    quick_checkout: true,
    state_abbr: optionalAddressText(address.state_abbr)?.toUpperCase(),
    state_name: optionalAddressText(address.state_name),
  }))

export const prepareExpressCheckoutPaymentInputSchema =
  checkoutCartInputSchema.extend({
    billingAddress: expressCheckoutAddressParamsSchema,
    email: z.string().trim().email(),
    shippingAddress: expressCheckoutAddressParamsSchema,
  })

export type SelectExpressCheckoutShippingRatesInput = z.infer<
  typeof selectExpressCheckoutShippingRatesInputSchema
>
export type PrepareExpressCheckoutPaymentInput = z.infer<
  typeof prepareExpressCheckoutPaymentInputSchema
>

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}
