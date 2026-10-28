// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  registerCustomer,
  requestCustomerPasswordReset,
  resetCustomerPassword,
} from './account.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapAuthUser: vi.fn(),
  mapCustomer: vi.fn(),
  persistCustomerAuthSession: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

const client = {
  customer: {
    get: vi.fn(),
  },
  customers: {
    create: vi.fn(),
  },
  passwordResets: {
    create: vi.fn(),
    update: vi.fn(),
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

vi.mock('@/lib/account/mappers/customer.mapper', () => ({
  mapSpreeAuthUserToProfile: server.mapAuthUser,
  mapSpreeCustomerToProfile: server.mapCustomer,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: server.getServerSpreeClientForMarket,
}))

vi.mock('@/lib/market/api/resolve-server-market', () => ({
  resolveServerMarket: server.resolveServerMarket,
}))

vi.mock('./customer-session.server', () => ({
  persistCustomerAuthSession: server.persistCustomerAuthSession,
}))

const tokens = {
  refresh_token: 'refresh-token',
  token: 'access-token',
  user: {
    email: 'ada@example.com',
    first_name: 'Ada',
    id: 'cust_requested',
    last_name: 'Lovelace',
  },
}

const market = { country: 'de', locale: 'de' }
const resolvedMarket = {
  country: 'de',
  currencyCode: 'EUR',
  locale: 'de',
  marketId: 'market-de',
}

const customerProfile = {
  accepts_email_marketing: false,
  available_store_credit_total: '0.00',
  display_available_store_credit_total: '$0.00',
  email: 'ada@example.com',
  first_name: 'Ada',
  id: 'cust_requested',
  last_name: 'Lovelace',
  phone: null,
}

describe('customer account authentication market context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    server.persistCustomerAuthSession.mockResolvedValue({
      refreshToken: 'refresh-token',
      token: 'access-token',
    })
    client.customer.get.mockResolvedValue(customerProfile)
    server.mapCustomer.mockReturnValue({ id: 'cust_requested' })
  })

  it('uses the selected market client for registration and cart association', async () => {
    client.customers.create.mockResolvedValue(tokens)

    await expect(
      registerCustomer({
        data: {
          acceptsEmailMarketing: false,
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          market,
          password: 'password123',
          passwordConfirmation: 'password123',
        },
      }),
    ).resolves.toEqual({ id: 'cust_requested' })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(client.customers.create).toHaveBeenCalledWith({
      accepts_email_marketing: false,
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      password: 'password123',
      password_confirmation: 'password123',
    })
    expect(server.persistCustomerAuthSession).toHaveBeenCalledWith({
      client,
      refreshToken: 'refresh-token',
      token: 'access-token',
    })
  })

  it.each([null, undefined, [], 'malformed'])(
    'rejects a malformed registration auth response before persisting the session: %o',
    async (response) => {
      client.customers.create.mockResolvedValue(response)

      await expect(
        registerCustomer({
          data: {
            acceptsEmailMarketing: false,
            email: 'ada@example.com',
            firstName: 'Ada',
            lastName: 'Lovelace',
            market,
            password: 'password123',
            passwordConfirmation: 'password123',
          },
        }),
      ).rejects.toThrow('customer authentication response is malformed')

      expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
    },
  )

  it('does not fall back to the auth user when registration returns an incomplete profile', async () => {
    client.customers.create.mockResolvedValue(tokens)
    client.customer.get.mockResolvedValue({ id: 'cust_requested' })
    server.mapAuthUser.mockReturnValue({ id: 'cust_requested' })

    await expect(
      registerCustomer({
        data: {
          acceptsEmailMarketing: false,
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          market,
          password: 'password123',
          passwordConfirmation: 'password123',
        },
      }),
    ).rejects.toThrow('customer profile response is malformed')

    expect(server.mapCustomer).not.toHaveBeenCalled()
    expect(server.mapAuthUser).not.toHaveBeenCalled()
    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
  })

  it('uses the selected market client for requesting a password reset', async () => {
    client.passwordResets.create.mockResolvedValue({
      id: 'password-reset-request',
      token: 'server-only-token',
    })

    await expect(
      requestCustomerPasswordReset({
        data: {
          email: 'ada@example.com',
          market,
        },
      }),
    ).resolves.toEqual({ success: true })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(client.passwordResets.create).toHaveBeenCalledWith({
      email: 'ada@example.com',
    })
  })

  it('does not expose the password reset response to the client', async () => {
    const rawResponse = {
      id: 'password-reset-request',
      token: 'server-only-token',
    }
    client.passwordResets.create.mockResolvedValue(rawResponse)

    await expect(
      requestCustomerPasswordReset({
        data: {
          email: 'ada@example.com',
          market,
        },
      }),
    ).resolves.not.toEqual(rawResponse)
  })

  it('uses the selected market client for password reset and cart association', async () => {
    client.passwordResets.update.mockResolvedValue(tokens)

    await expect(
      resetCustomerPassword({
        data: {
          market,
          password: 'password123',
          passwordConfirmation: 'password123',
          token: 'reset-token',
        },
      }),
    ).resolves.toEqual({ id: 'cust_requested' })

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(client.passwordResets.update).toHaveBeenCalledWith('reset-token', {
      password: 'password123',
      password_confirmation: 'password123',
    })
    expect(server.persistCustomerAuthSession).toHaveBeenCalledWith({
      client,
      refreshToken: 'refresh-token',
      token: 'access-token',
    })
  })

  it.each([null, undefined, [], 'malformed'])(
    'rejects a malformed password-reset auth response before persisting the session: %o',
    async (response) => {
      client.passwordResets.update.mockResolvedValue(response)

      await expect(
        resetCustomerPassword({
          data: {
            market,
            password: 'password123',
            passwordConfirmation: 'password123',
            token: 'reset-token',
          },
        }),
      ).rejects.toThrow('customer authentication response is malformed')

      expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
    },
  )

  it('does not persist auth when the password-reset profile is incomplete', async () => {
    client.passwordResets.update.mockResolvedValue(tokens)
    client.customer.get.mockResolvedValue({ id: 'cust_requested' })

    await expect(
      resetCustomerPassword({
        data: {
          market,
          password: 'password123',
          passwordConfirmation: 'password123',
          token: 'reset-token',
        },
      }),
    ).rejects.toThrow('customer profile response is malformed')

    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
  })
})
