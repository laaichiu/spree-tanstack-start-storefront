import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'

import {
  getAddressCountries,
  getAddressCountry,
} from '@/lib/market/api/address-country.functions'

const addressCountriesQueryKey = ['address-countries'] as const
const addressCountryQueryKey = ['address-country'] as const

export function useAddressCountries(enabled = true) {
  const { market } = useMarket()
  const getAddressCountriesFn = useServerFn(getAddressCountries)

  return useQuery({
    enabled,
    queryFn: () =>
      getAddressCountriesFn({
        data: {
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    queryKey: [...addressCountriesQueryKey, market.country, market.locale],
    staleTime: 1000 * 60 * 60,
  })
}

export function useAddressCountry(countryIso: string, enabled: boolean) {
  const { market } = useMarket()
  const getAddressCountryFn = useServerFn(getAddressCountry)
  const normalizedCountryIso = countryIso.trim().toUpperCase()

  return useQuery({
    enabled: enabled && /^[A-Z]{2}$/.test(normalizedCountryIso),
    queryFn: () =>
      getAddressCountryFn({
        data: {
          countryIso: normalizedCountryIso,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    queryKey: [
      ...addressCountryQueryKey,
      market.country,
      market.locale,
      normalizedCountryIso,
    ],
    staleTime: 1000 * 60 * 60,
  })
}
