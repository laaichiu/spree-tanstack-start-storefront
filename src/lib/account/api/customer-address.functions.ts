import type { AddressParams, ListParams } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import {
  mapSpreeAddressesToCustomerAddresses,
  mapSpreeAddressToCustomerAddress,
} from '@/lib/account/mappers/customer-address.mapper'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CustomerAddressInput } from '@/lib/account/validation/address'

function optionalAddressText(value: string) {
  const normalized = value.trim()

  return normalized || undefined
}

function mapCustomerAddressInputToParams(
  input: CustomerAddressInput,
): AddressParams {
  return {
    address1: input.address1,
    address2: optionalAddressText(input.address2),
    city: input.city,
    company: optionalAddressText(input.company),
    country_iso: input.countryIso.toUpperCase(),
    first_name: input.firstName,
    is_default_billing: input.isDefaultBilling,
    is_default_shipping: input.isDefaultShipping,
    last_name: input.lastName,
    phone: optionalAddressText(input.phone),
    postal_code: input.postalCode,
    state_abbr: optionalAddressText(input.stateAbbr)?.toUpperCase(),
    state_name: optionalAddressText(input.stateName),
  }
}

export const getCustomerAddresses = createServerFn({ method: 'GET' })
  .validator((data: { params?: ListParams } | undefined) => ({
    params: data?.params,
  }))
  .handler(async ({ data }): Promise<Array<CustomerAddress>> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const response = await client.customer.addresses.list(data.params, {
        token,
      })

      return mapSpreeAddressesToCustomerAddresses(response.data)
    })
  })

export const createCustomerAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as CustomerAddressInput)
  .handler(async ({ data }): Promise<CustomerAddress> => {
    const { customerAddressSchema } =
      await import('@/lib/account/validation/address')
    const input = customerAddressSchema.parse(data)
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const address = await client.customer.addresses.create(
        mapCustomerAddressInputToParams(input),
        { token },
      )

      return mapSpreeAddressToCustomerAddress(address)
    })
  })

export const updateCustomerAddress = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      data as {
        address: CustomerAddressInput
        id: string
      },
  )
  .handler(async ({ data }): Promise<CustomerAddress> => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { customerAddressSchema } =
      await import('@/lib/account/validation/address')
    const input = z
      .object({
        address: customerAddressSchema,
        id: z.string().trim().min(1),
      })
      .parse(data)
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const address = await client.customer.addresses.update(
        input.id,
        mapCustomerAddressInputToParams(input.address),
        { token },
      )

      return mapSpreeAddressToCustomerAddress(address)
    })
  })

export const deleteCustomerAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as { id: string })
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const input = z
      .object({
        id: z.string().trim().min(1),
      })
      .parse(data)
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      await client.customer.addresses.delete(input.id, { token })

      return {
        success: true,
      }
    })
  })
