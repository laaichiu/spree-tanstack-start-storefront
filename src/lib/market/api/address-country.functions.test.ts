// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAddressCountries,
  getAddressCountry,
} from './address-country.functions'
import { addressCountryResource } from '../utils/address-country-response.test-support'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapCountries: vi.fn(),
  mapCountry: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

const client = {
  countries: {
    get: vi.fn(),
    list: vi.fn(),
  },
  markets: {
    countries: {
      get: vi.fn(),
      list: vi.fn(),
    },
  },
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let inputValidator: unknown
    const builder = {
      handler: (handler: unknown) => (options: { data: unknown }) => {
        const validatedData =
          typeof inputValidator === 'function'
            ? (inputValidator as (data: unknown) => unknown)(options.data)
            : options.data

        return (handler as (options: { data: unknown }) => unknown)({
          data: validatedData,
        })
      },
      validator: (validator: unknown) => {
        inputValidator = validator
        return builder
      },
    }

    return builder
  },
}))

vi.mock('@/lib/market/mappers/address-country.mapper', () => ({
  mapSpreeCountriesToAddressCountries: server.mapCountries,
  mapSpreeCountryToAddressCountry: server.mapCountry,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

const market = { country: 'us', locale: 'en' }

describe('address country response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(market)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    client.countries.get.mockResolvedValue({
      iso: 'US',
      name: 'United States',
      states: [],
      states_required: true,
      zipcode_required: true,
    })
    client.countries.list.mockResolvedValue({
      data: [addressCountryResource()],
    })
    server.mapCountries.mockReturnValue([{ iso: 'US' }])
    server.mapCountry.mockReturnValue({ iso: 'US' })
  })

  it('maps a country whose ISO matches the requested country', async () => {
    await expect(
      getAddressCountry({
        data: { countryIso: 'us', market },
      }),
    ).resolves.toEqual({ iso: 'US' })

    expect(client.countries.get).toHaveBeenCalledWith('US', {
      expand: ['states'],
    })
    expect(server.mapCountry).toHaveBeenCalledWith(
      {
        iso: 'US',
        name: 'United States',
        states: [],
        states_required: true,
        zipcode_required: true,
      },
      'en',
    )
  })

  it('uses the active market country endpoint for country details', async () => {
    const marketWithId = { ...market, marketId: 'mkt_us' }
    server.resolveServerMarket.mockResolvedValueOnce(marketWithId)
    client.markets.countries.get.mockResolvedValue({
      iso: 'US',
      name: 'United States',
      states: [],
      states_required: true,
      zipcode_required: true,
    })

    await expect(
      getAddressCountry({
        data: { countryIso: 'us', market: marketWithId },
      }),
    ).resolves.toEqual({ iso: 'US' })

    expect(client.markets.countries.get).toHaveBeenCalledWith('mkt_us', 'US', {
      expand: ['states'],
    })
    expect(client.countries.get).not.toHaveBeenCalled()
  })

  it('fails closed before mapping another country', async () => {
    client.countries.get.mockResolvedValue({
      iso: 'CA',
      name: 'Canada',
      states: [],
      states_required: true,
      zipcode_required: true,
    })

    await expect(
      getAddressCountry({
        data: { countryIso: 'us', market },
      }),
    ).rejects.toThrow('does not match the requested country')

    expect(server.mapCountry).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed country detail resource', async () => {
    client.countries.get.mockResolvedValueOnce({
      iso: 'US',
      name: 'United States',
      states: 'malformed',
      states_required: true,
      zipcode_required: true,
    })

    await expect(
      getAddressCountry({
        data: { countryIso: 'us', market },
      }),
    ).rejects.toThrow('address country response is malformed')

    expect(server.mapCountry).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a response without a country ISO', async () => {
    client.countries.get.mockResolvedValue({})

    await expect(
      getAddressCountry({
        data: { countryIso: 'us', market },
      }),
    ).rejects.toThrow('address country response is malformed')

    expect(server.mapCountry).not.toHaveBeenCalled()
  })

  it('maps countries only after validating the list envelope and item identity', async () => {
    await expect(getAddressCountries({ data: { market } })).resolves.toEqual([
      { iso: 'US' },
    ])

    expect(server.mapCountries).toHaveBeenCalledWith(
      [addressCountryResource()],
      'en',
    )
  })

  it('uses the active market country endpoint for country lists', async () => {
    const marketWithId = { ...market, marketId: 'mkt_us' }
    server.resolveServerMarket.mockResolvedValueOnce(marketWithId)
    client.markets.countries.list.mockResolvedValue({
      data: [addressCountryResource()],
    })

    await expect(
      getAddressCountries({ data: { market: marketWithId } }),
    ).resolves.toEqual([{ iso: 'US' }])

    expect(client.markets.countries.list).toHaveBeenCalledWith('mkt_us')
    expect(client.countries.list).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed country list envelope', async () => {
    client.countries.list.mockResolvedValueOnce({ data: null })

    await expect(getAddressCountries({ data: { market } })).rejects.toThrow(
      'address country list response is malformed',
    )
    expect(server.mapCountries).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed country list item', async () => {
    client.countries.list.mockResolvedValueOnce({
      data: [addressCountryResource({ states: 'malformed' })],
    })

    await expect(getAddressCountries({ data: { market } })).rejects.toThrow(
      'address country list response is malformed',
    )
    expect(server.mapCountries).not.toHaveBeenCalled()
  })
})
