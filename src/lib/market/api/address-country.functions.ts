import { createServerFn } from '@tanstack/react-start'

import {
  mapSpreeCountriesToAddressCountries,
  mapSpreeCountryToAddressCountry,
} from '@/lib/market/mappers/address-country.mapper'
import type { AddressCountry } from '@/lib/market/model/address-country'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

type AddressCountryMarketInput = {
  market: MarketSelectionInput
}

type AddressCountryInput = AddressCountryMarketInput & {
  countryIso: string
}

export const getAddressCountries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as AddressCountryMarketInput)
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
    const response =
      await getServerSpreeClientForMarket(market).countries.list()

    return mapSpreeCountriesToAddressCountries(response.data)
  })

export const getAddressCountry = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as AddressCountryInput)
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
    const country = await getServerSpreeClientForMarket(market).countries.get(
      input.countryIso.toUpperCase(),
      {
        expand: ['states'],
      },
    )

    return mapSpreeCountryToAddressCountry(country)
  })
