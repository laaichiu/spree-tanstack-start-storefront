import { createServerFn } from '@tanstack/react-start'

import {
  mapSpreeCountriesToAddressCountries,
  mapSpreeCountryToAddressCountry,
} from '@/lib/market/mappers/address-country.mapper'
import type { AddressCountry } from '@/lib/core/address'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import {
  assertAddressCountryListResponse,
  assertAddressCountryResourceIsCountry,
} from '../utils/address-country-list-response'
import {
  assertAddressCountryDetailResource,
  assertAddressCountryResourceMatchesIso,
} from '../utils/address-country-identity'

export const getAddressCountries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<AddressCountry[]> => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const response = market.marketId
      ? await client.markets.countries.list(market.marketId)
      : await client.countries.list()
    assertAddressCountryListResponse(response)
    response.data.forEach(assertAddressCountryResourceIsCountry)

    return mapSpreeCountriesToAddressCountries(response.data, market.locale)
  })

export const getAddressCountry = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<AddressCountry> => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
        countryIso: z
          .string()
          .trim()
          .regex(/^[a-zA-Z]{2}$/),
      })
      .parse(data)
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const country = market.marketId
      ? await client.markets.countries.get(
          market.marketId,
          input.countryIso.toUpperCase(),
          {
            expand: ['states'],
          },
        )
      : await client.countries.get(input.countryIso.toUpperCase(), {
          expand: ['states'],
        })
    assertAddressCountryDetailResource(country)
    assertAddressCountryResourceMatchesIso(country, input.countryIso)

    return mapSpreeCountryToAddressCountry(country, market.locale)
  })
