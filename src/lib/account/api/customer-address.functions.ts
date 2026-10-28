import type { AddressCreateParams } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { marketInputSchema } from '@/lib/market/utils/market-input'
import {
  mapSpreeAddressesToCustomerAddresses,
  mapSpreeAddressToCustomerAddress,
} from '@/lib/account/mappers/customer-address.mapper'
import type { CustomerAddress } from '@/lib/account/contracts'
import {
  customerAddressDeleteRequestSchema,
  customerAddressRequestSchema,
  customerAddressUpdateRequestSchema,
} from '@/lib/account/validation/address'
import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { toSpreeCountryCode } from '@/lib/runtime/country-code'
import {
  assertCustomerAddressId,
  assertCustomerAddressResourceIsAddress,
  assertCustomerAddressResourceMatchesId,
} from '../utils/address-identity'
import { assertCustomerListResponse } from '../utils/customer-list-response'
import { parseCustomerListParams } from './customer-list-params'
import { getCustomerRequestRecord } from './customer-request-record'

function optionalAddressText(value: string) {
  const normalized = value.trim()

  return normalized || undefined
}

function mapCustomerAddressInputToParams(
  input: CustomerAddressInput,
): AddressCreateParams {
  return {
    address1: input.address1,
    address2: optionalAddressText(input.address2),
    city: input.city,
    company: optionalAddressText(input.company),
    country_code: toSpreeCountryCode(input.countryIso),
    first_name: input.firstName,
    is_default_billing: input.isDefaultBilling,
    is_default_shipping: input.isDefaultShipping,
    last_name: input.lastName,
    phone: optionalAddressText(input.phone),
    postal_code: input.postalCode,
    state_code: optionalAddressText(input.stateAbbr)?.toUpperCase(),
    state_name: optionalAddressText(input.stateName),
  }
}

export const getCustomerAddresses = createServerFn({ method: 'GET' })
  .validator((data: unknown) => parseCustomerAddressListRequest(data))
  .handler(async ({ data }): Promise<Array<CustomerAddress>> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        const response = await client.customer.addresses.list(data.params, {
          token,
        })

        assertCustomerListResponse(response)
        response.data.forEach(assertCustomerAddressResourceIsAddress)

        return mapSpreeAddressesToCustomerAddresses(
          response.data,
          market.locale,
        )
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

export const createCustomerAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerAddressRequestSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerAddress> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const { market, ...input } = data
    const resolvedMarket = await resolveServerMarket(market)

    return withCustomerSession(
      async ({ client, token }) => {
        const address = await client.customer.addresses.create(
          mapCustomerAddressInputToParams(input),
          { token },
        )

        assertCustomerAddressResourceIsAddress(address)

        return mapSpreeAddressToCustomerAddress(address, market.locale)
      },
      { client: getServerSpreeClientForMarket(resolvedMarket) },
    )
  })

export const updateCustomerAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerAddressUpdateRequestSchema.parse(data))
  .handler(async ({ data }): Promise<CustomerAddress> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { market, ...input } = data
    const resolvedMarket = await resolveServerMarket(market)
    assertCustomerAddressId(input.id)
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(
      async ({ client, token }) => {
        const address = await client.customer.addresses.update(
          input.id,
          mapCustomerAddressInputToParams(input.address),
          { token },
        )

        assertCustomerAddressResourceIsAddress(address)
        assertCustomerAddressResourceMatchesId(address, input.id)

        return mapSpreeAddressToCustomerAddress(address, market.locale)
      },
      { client: getServerSpreeClientForMarket(resolvedMarket) },
    )
  })

export const deleteCustomerAddress = createServerFn({ method: 'POST' })
  .validator((data: unknown) => customerAddressDeleteRequestSchema.parse(data))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    assertCustomerAddressId(data.id)
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        await client.customer.addresses.delete(data.id, { token })

        return {
          success: true,
        }
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

function parseCustomerAddressListRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer address request is required.')
  }

  return {
    market: marketInputSchema.parse(request.market),
    params: parseCustomerListParams(request.params, [
      'created_at',
      'id',
      'updated_at',
    ] as const),
  }
}
