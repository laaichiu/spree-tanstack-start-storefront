// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCurrentCustomerProfile,
  updateCustomerProfileOnServer,
} from './customer-profile.server'

const server = vi.hoisted(() => ({
  mapCustomer: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const client = {
  customer: {
    get: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/account/mappers/customer.mapper', () => ({
  mapSpreeCustomerToProfile: server.mapCustomer,
}))

vi.mock('./customer-session.server', () => ({
  CustomerSessionRequiredError: class CustomerSessionRequiredError extends Error {},
  withCustomerSession: server.withCustomerSession,
}))

const profileInput = {
  acceptsEmailMarketing: true,
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+1 555 0100',
}

const customerProfile = {
  accepts_email_marketing: true,
  available_store_credit_total: '0.00',
  display_available_store_credit_total: '$0.00',
  email: 'ada@example.com',
  first_name: 'Ada',
  id: 'cust_current',
  last_name: 'Lovelace',
  phone: null,
}

describe('customer profile response boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.withCustomerSession.mockImplementation(
      (
        action: (context: { client: typeof client; token: string }) => unknown,
        options?: { client?: typeof client },
      ) =>
        action({ client: options?.client ?? client, token: 'customer-token' }),
    )
  })

  it('passes an explicit market client into the customer session boundary', async () => {
    const suppliedClient = {
      customer: { get: vi.fn().mockResolvedValue(customerProfile) },
    }
    server.mapCustomer.mockReturnValue({ id: 'cust_current' })

    await expect(
      getCurrentCustomerProfile({
        client: suppliedClient as never,
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).resolves.toEqual({ id: 'cust_current' })

    expect(suppliedClient.customer.get).toHaveBeenCalledWith({
      token: 'customer-token',
    })
    expect(server.withCustomerSession).toHaveBeenCalledWith(
      expect.any(Function),
      { client: suppliedClient },
    )
  })

  it('maps a customer response after validating its resource type', async () => {
    const customer = customerProfile
    const mappedProfile = { id: 'cust_current' }
    client.customer.get.mockResolvedValue(customer)
    server.mapCustomer.mockReturnValue(mappedProfile)

    await expect(
      getCurrentCustomerProfile({
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).resolves.toBe(mappedProfile)

    expect(server.mapCustomer).toHaveBeenCalledWith(customer, {
      currencyCode: 'USD',
      locale: 'en',
    })
  })

  it('fails closed before mapping a non-customer profile response', async () => {
    client.customer.get.mockResolvedValue({ id: 'card_123' })

    await expect(
      getCurrentCustomerProfile({
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).rejects.toThrow('not a customer resource')

    expect(server.mapCustomer).not.toHaveBeenCalled()
  })

  it('fails closed before mapping an incomplete customer profile response', async () => {
    client.customer.get.mockResolvedValue({ id: 'cust_current' })

    await expect(
      getCurrentCustomerProfile({
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).rejects.toThrow('customer profile response is malformed')

    expect(server.mapCustomer).not.toHaveBeenCalled()
  })

  it('validates the current customer before updating the profile', async () => {
    client.customer.get.mockResolvedValue({ id: 'user_123' })

    await expect(
      updateCustomerProfileOnServer(profileInput, {
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).rejects.toThrow('not a customer resource')

    expect(client.customer.update).not.toHaveBeenCalled()
    expect(server.mapCustomer).not.toHaveBeenCalled()
  })

  it('fails closed before mapping an update response for another customer', async () => {
    const currentCustomer = {
      ...customerProfile,
      email: 'old@example.com',
    }
    client.customer.get.mockResolvedValue(currentCustomer)
    client.customer.update.mockResolvedValue({ id: 'cust_other' })

    await expect(
      updateCustomerProfileOnServer(profileInput, {
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).rejects.toThrow('does not match the authenticated customer')

    expect(server.mapCustomer).not.toHaveBeenCalled()
  })

  it('maps an update response that matches the current customer', async () => {
    const currentCustomer = {
      ...customerProfile,
      email: 'old@example.com',
    }
    const updatedCustomer = customerProfile
    const mappedProfile = { id: 'cust_current' }
    client.customer.get.mockResolvedValue(currentCustomer)
    client.customer.update.mockResolvedValue(updatedCustomer)
    server.mapCustomer.mockReturnValue(mappedProfile)

    await expect(
      updateCustomerProfileOnServer(profileInput, {
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).resolves.toBe(mappedProfile)

    expect(client.customer.update).toHaveBeenCalledWith(
      {
        accepts_email_marketing: true,
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        phone: '+1 555 0100',
      },
      { token: 'customer-token' },
    )
    expect(server.mapCustomer).toHaveBeenCalledWith(updatedCustomer, {
      currencyCode: 'USD',
      locale: 'en',
    })
  })

  it('fails closed before mapping an incomplete profile update response', async () => {
    const currentCustomer = {
      ...customerProfile,
      email: 'old@example.com',
    }
    client.customer.get.mockResolvedValue(currentCustomer)
    client.customer.update.mockResolvedValue({ id: 'cust_current' })

    await expect(
      updateCustomerProfileOnServer(profileInput, {
        moneyContext: { currencyCode: 'USD', locale: 'en' },
      }),
    ).rejects.toThrow('customer profile response is malformed')

    expect(server.mapCustomer).not.toHaveBeenCalled()
  })
})
