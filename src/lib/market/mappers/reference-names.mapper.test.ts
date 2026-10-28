import { createClient } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import { assertMarketResponse } from '../utils/market-resource-identity'
import { assertAddressCountryResourceIsCountry } from '../utils/address-country-list-response'
import { marketResource } from '../utils/market-response.test-support'
import { mapSpreeMarketsToStorefrontMarkets } from './market.mapper'
import { mapSpreeCountriesToAddressCountries } from './address-country.mapper'

const countries = ['US', 'DE'].map((iso) => ({
  iso,
  states: [],
  states_required: false,
  zipcode_required: true,
}))

function clientFor(data: unknown[]) {
  return createClient({
    baseUrl: 'https://api.example.com',
    publishableKey: 'pk_test',
    retry: false,
    fetch: async () =>
      new Response(JSON.stringify({ data }), {
        headers: { 'Content-Type': 'application/json' },
      }),
  })
}

describe('reference names without deprecated country names', () => {
  it('maps SDK Markets and countries without name fields into localized choices', async () => {
    const response = await clientFor([
      marketResource({
        countries,
        country_codes: ['US', 'DE'],
        supported_locales: ['en', 'ja'],
      }),
    ]).markets.list()
    response.data.forEach(assertMarketResponse)
    const [market] = mapSpreeMarketsToStorefrontMarkets(response.data, 'ja')
    expect(market.countries.map((country) => country.countryName)).toEqual([
      'アメリカ合衆国',
      'ドイツ',
    ])
    expect(market.locales.map((locale) => locale.label)).toEqual([
      '英語',
      '日本語',
    ])
  })

  it('maps address country names from ISO codes and sorts in the reader locale', async () => {
    const response = await clientFor(countries).countries.list()
    response.data.forEach(assertAddressCountryResourceIsCountry)
    expect(
      mapSpreeCountriesToAddressCountries(response.data, 'de').map(
        (country) => country.name,
      ),
    ).toEqual(['Deutschland', 'Vereinigte Staaten'])
  })

  it('validates Market membership from country codes independently of names', () => {
    expect(() =>
      assertMarketResponse(
        marketResource({ countries: [{ iso: 'DE', name: 'United States' }] }),
      ),
    ).toThrow('market response is malformed')
    expect(() =>
      assertMarketResponse(
        marketResource({ countries: [{ iso: 'US', name: null }] }),
      ),
    ).not.toThrow()
  })
})
