// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCurrentCustomer,
  logoutCustomer,
  updateCustomerProfile,
} from './customer-session.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  getCurrentCustomerProfile: vi.fn(),
  logoutCustomerOnServer: vi.fn(),
  resolveServerMarket: vi.fn(),
  updateCustomerProfileOnServer: vi.fn(),
}))

const client = {
  auth: {
    logout: vi.fn(),
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

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('./customer-session.server', () => ({
  logoutCustomerOnServer: server.logoutCustomerOnServer,
}))

vi.mock('./customer-profile.server', () => ({
  getCurrentCustomerProfile: server.getCurrentCustomerProfile,
  updateCustomerProfileOnServer: server.updateCustomerProfileOnServer,
}))

const market = { country: 'de', locale: 'de' }
const resolvedMarket = {
  country: 'de',
  currencyCode: 'EUR',
  locale: 'de',
  marketId: 'market-de',
}

describe('customer logout market context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    server.getCurrentCustomerProfile.mockResolvedValue({ id: 'cust_current' })
    server.logoutCustomerOnServer.mockResolvedValue({ success: true })
    server.updateCustomerProfileOnServer.mockResolvedValue({
      id: 'cust_current',
    })
  })

  it('uses the selected market client for the current customer profile', async () => {
    await expect(getCurrentCustomer({ data: market })).resolves.toEqual({
      id: 'cust_current',
    })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.getCurrentCustomerProfile).toHaveBeenCalledWith({
      moneyContext: resolvedMarket,
      client,
    })
  })

  it('uses the selected market client for profile updates', async () => {
    const profile = {
      acceptsEmailMarketing: true,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+1 555 0100',
    }

    await expect(
      updateCustomerProfile({ data: { ...profile, market } }),
    ).resolves.toEqual({ id: 'cust_current' })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.updateCustomerProfileOnServer).toHaveBeenCalledWith(profile, {
      moneyContext: resolvedMarket,
      client,
    })
  })

  it('uses the selected market client for logout', async () => {
    await expect(logoutCustomer({ data: market })).resolves.toEqual({
      success: true,
    })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.logoutCustomerOnServer).toHaveBeenCalledWith({ client })
  })
})
