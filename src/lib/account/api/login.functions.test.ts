// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loginCustomer } from './login.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapAuthUser: vi.fn(),
  mapCustomer: vi.fn(),
  persistCustomerAuthSession: vi.fn(),
  resolveServerMarket: vi.fn(),
}))

const client = {
  auth: {
    login: vi.fn(),
  },
  customer: {
    get: vi.fn(),
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
  getServerSpreeClient: vi.fn(() => client),
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

const loginInput = {
  email: 'ada@example.com',
  market: { country: 'us', locale: 'en' },
  password: 'password',
}
const resolvedMarket = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

describe('customer login response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resolveServerMarket.mockResolvedValue(resolvedMarket)
    server.getServerSpreeClientForMarket.mockReturnValue(client)
    client.auth.login.mockResolvedValue(tokens)
    server.persistCustomerAuthSession.mockResolvedValue({
      refreshToken: 'refresh-token',
      token: 'access-token',
    })
  })

  it('maps a matching customer response', async () => {
    const customer = {
      accepts_email_marketing: false,
      available_store_credit_total: '0.00',
      display_available_store_credit_total: '$0.00',
      email: 'ada@example.com',
      first_name: 'Ada',
      id: 'cust_requested',
      last_name: 'Lovelace',
      phone: null,
    }
    const mappedProfile = { id: 'cust_requested' }
    client.customer.get.mockResolvedValue(customer)
    server.mapCustomer.mockReturnValue(mappedProfile)

    await expect(loginCustomer({ data: loginInput })).resolves.toBe(
      mappedProfile,
    )

    expect(client.auth.login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password',
    })
    expect(server.resolveServerMarket).toHaveBeenCalledWith(loginInput.market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.persistCustomerAuthSession).toHaveBeenCalledWith({
      client,
      refreshToken: 'refresh-token',
      token: 'access-token',
    })
    expect(server.mapCustomer).toHaveBeenCalledWith(
      customer,
      expect.objectContaining({ currencyCode: 'USD', locale: 'en' }),
    )
    expect(server.mapAuthUser).not.toHaveBeenCalled()
  })

  it('does not fall back to the auth user when the customer profile is incomplete', async () => {
    client.customer.get.mockResolvedValue({ id: 'cust_requested' })
    server.mapAuthUser.mockReturnValue({ id: 'cust_requested' })

    await expect(loginCustomer({ data: loginInput })).rejects.toThrow(
      'customer profile response is malformed',
    )

    expect(server.mapCustomer).not.toHaveBeenCalled()
    expect(server.mapAuthUser).not.toHaveBeenCalled()
    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
  })

  it('does not fall back to the auth user when profile projection fails', async () => {
    const customer = {
      accepts_email_marketing: false,
      available_store_credit_total: '0.00',
      display_available_store_credit_total: '$0.00',
      email: 'ada@example.com',
      first_name: 'Ada',
      id: 'cust_requested',
      last_name: 'Lovelace',
      phone: null,
    }
    const projectionError = new Error('profile projection failed')

    client.customer.get.mockResolvedValue(customer)
    server.mapCustomer.mockImplementationOnce(() => {
      throw projectionError
    })
    server.mapAuthUser.mockReturnValue({ id: 'cust_requested' })

    await expect(loginCustomer({ data: loginInput })).rejects.toBe(
      projectionError,
    )

    expect(server.mapAuthUser).not.toHaveBeenCalled()
    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
  })

  it('does not fall back to auth-user mapping when the customer identity differs', async () => {
    client.customer.get.mockResolvedValue({ id: 'cust_other' })
    server.mapAuthUser.mockReturnValue({ id: 'cust_requested' })

    await expect(loginCustomer({ data: loginInput })).rejects.toThrow(
      'does not match the authenticated customer',
    )

    expect(server.mapCustomer).not.toHaveBeenCalled()
    expect(server.mapAuthUser).not.toHaveBeenCalled()
    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
  })

  it('rejects a non-customer auth identity before persisting the session', async () => {
    client.auth.login.mockResolvedValue({
      ...tokens,
      user: { ...tokens.user, id: 'user_requested' },
    })

    await expect(loginCustomer({ data: loginInput })).rejects.toThrow(
      'not a customer resource',
    )

    expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
    expect(client.customer.get).not.toHaveBeenCalled()
  })

  it.each([null, undefined, [], 'malformed'])(
    'rejects a malformed auth response before persisting the session: %o',
    async (response) => {
      client.auth.login.mockResolvedValue(response)

      await expect(loginCustomer({ data: loginInput })).rejects.toThrow(
        'customer authentication response is malformed',
      )

      expect(server.persistCustomerAuthSession).not.toHaveBeenCalled()
      expect(client.customer.get).not.toHaveBeenCalled()
    },
  )
})
