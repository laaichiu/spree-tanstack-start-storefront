// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  updateCustomerAddress,
} from './customer-address.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapAddress: vi.fn(),
  mapAddresses: vi.fn(),
  resolveServerMarket: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const client = {
  customer: {
    addresses: {
      create: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
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

vi.mock('@/lib/account/mappers/customer-address.mapper', () => ({
  mapSpreeAddressToCustomerAddress: server.mapAddress,
  mapSpreeAddressesToCustomerAddresses: server.mapAddresses,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('./customer-session.server', () => ({
  withCustomerSession: server.withCustomerSession,
}))

const addressInput = {
  address1: '1 Main Street',
  address2: '',
  city: 'Boston',
  company: '',
  countryIso: 'us',
  firstName: 'Ada',
  isDefaultBilling: false,
  isDefaultShipping: true,
  lastName: 'Lovelace',
  phone: '',
  postalCode: '02108',
  stateAbbr: 'ma',
  stateName: '',
}

const market = { country: 'us', locale: 'en' }
const resolvedMarket = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

describe('customer address response boundary', () => {
  const address = {
    address1: '1 Main Street',
    address2: null,
    city: 'Boston',
    company: null,
    country_code: 'US',
    country_name: 'United States',
    first_name: 'Ada',
    full_name: 'Ada Lovelace',
    id: 'addr_requested',
    is_default_billing: false,
    is_default_shipping: true,
    last_name: 'Lovelace',
    phone: null,
    postal_code: '02108',
    quick_checkout: false,
    state_code: 'MA',
    state_name: null,
    state_text: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    server.withCustomerSession.mockImplementation(
      (
        action: (context: { client: typeof client; token: string }) => unknown,
      ) => action({ client, token: 'customer-token' }),
    )
  })

  it('validates every address in a list before mapping', async () => {
    const addresses = [
      { ...address, id: 'addr_first' },
      { ...address, id: 'addr_second' },
    ]
    const mappedAddresses = [{ id: 'addr_first' }, { id: 'addr_second' }]
    client.customer.addresses.list.mockResolvedValue({ data: addresses })
    server.mapAddresses.mockReturnValue(mappedAddresses)

    await expect(
      getCustomerAddresses({ data: { market, params: undefined } }),
    ).resolves.toBe(mappedAddresses)

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client },
    )
    expect(server.mapAddresses).toHaveBeenCalledWith(addresses, 'en')
  })

  it('fails closed before mapping a non-address list response', async () => {
    client.customer.addresses.list.mockResolvedValue({
      data: [{ id: 'card_123' }],
    })

    await expect(
      getCustomerAddresses({ data: { market, params: undefined } }),
    ).rejects.toThrow('not an address resource')

    expect(server.mapAddresses).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed list envelope', async () => {
    client.customer.addresses.list.mockResolvedValue({ data: null })

    await expect(
      getCustomerAddresses({ data: { market, params: undefined } }),
    ).rejects.toThrow('customer list response is malformed')

    expect(server.mapAddresses).not.toHaveBeenCalled()
  })

  it('validates a created address before mapping it', async () => {
    const createdAddress = { ...address, id: 'addr_created' }
    const mappedAddress = { id: 'addr_created' }
    client.customer.addresses.create.mockResolvedValue(createdAddress)
    server.mapAddress.mockReturnValue(mappedAddress)

    await expect(
      createCustomerAddress({ data: { ...addressInput, market } }),
    ).resolves.toBe(mappedAddress)

    expect(server.mapAddress).toHaveBeenCalledWith(createdAddress, 'en')
    expect(client.customer.addresses.create.mock.calls[0][0]).toMatchObject({
      country_code: 'US',
      state_code: 'MA',
    })
    expect(
      client.customer.addresses.create.mock.calls[0][0],
    ).not.toHaveProperty('state_abbr')
  })

  it('fails closed before mapping a created non-address response', async () => {
    client.customer.addresses.create.mockResolvedValue({ id: 'card_created' })

    await expect(
      createCustomerAddress({ data: { ...addressInput, market } }),
    ).rejects.toThrow('not an address resource')

    expect(server.mapAddress).not.toHaveBeenCalled()
  })

  it('rejects a non-address update id before creating a customer session', async () => {
    await expect(
      updateCustomerAddress({
        data: { address: addressInput, id: 'card_requested', market },
      }),
    ).rejects.toThrow('not an address resource')

    expect(server.withCustomerSession).not.toHaveBeenCalled()
    expect(client.customer.addresses.update).not.toHaveBeenCalled()
  })

  it('does not map an update response for another requested address', async () => {
    client.customer.addresses.update.mockResolvedValue({
      ...address,
      id: 'addr_other',
    })

    await expect(
      updateCustomerAddress({
        data: { address: addressInput, id: 'addr_requested', market },
      }),
    ).rejects.toThrow('does not match the requested address')

    expect(server.mapAddress).not.toHaveBeenCalled()
  })

  it('fails closed before mapping an update response with an incomplete shape', async () => {
    client.customer.addresses.update.mockResolvedValue({
      ...address,
      full_name: undefined,
    })

    await expect(
      updateCustomerAddress({
        data: { address: addressInput, id: 'addr_requested', market },
      }),
    ).rejects.toThrow('not an address resource')

    expect(server.mapAddress).not.toHaveBeenCalled()
  })

  it('validates the delete id before creating a customer session', async () => {
    await expect(
      deleteCustomerAddress({ data: { id: 'gc_requested', market } }),
    ).rejects.toThrow('not an address resource')

    expect(server.withCustomerSession).not.toHaveBeenCalled()
    expect(client.customer.addresses.delete).not.toHaveBeenCalled()
  })
})
