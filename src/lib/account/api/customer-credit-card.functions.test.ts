// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteCustomerCreditCard,
  getCustomerCreditCards,
} from './customer-credit-card.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapCards: vi.fn(),
  resolveServerMarket: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const client = {
  customer: {
    creditCards: {
      delete: vi.fn(),
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

vi.mock('@/lib/account/mappers/customer-credit-card.mapper', () => ({
  mapSpreeCreditCardsToCustomerCreditCards: server.mapCards,
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

const market = { country: 'us', locale: 'en' }
const resolvedMarket = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
}

describe('customer credit-card response boundary', () => {
  const card = {
    brand: 'Visa',
    default: false,
    gateway_payment_profile_id: 'profile_requested',
    id: 'card_requested',
    last4: '4242',
    month: 12,
    name: null,
    year: 2030,
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

  it('validates every card in a list before mapping', async () => {
    const cards = [
      { ...card, id: 'card_first' },
      { ...card, id: 'card_second' },
    ]
    const mappedCards = [{ id: 'card_first' }, { id: 'card_second' }]
    client.customer.creditCards.list.mockResolvedValue({ data: cards })
    server.mapCards.mockReturnValue(mappedCards)

    await expect(
      getCustomerCreditCards({ data: { market, params: undefined } }),
    ).resolves.toBe(mappedCards)

    expect(server.mapCards).toHaveBeenCalledWith(cards)
    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
  })

  it('fails closed before mapping a non-card list response', async () => {
    client.customer.creditCards.list.mockResolvedValue({
      data: [{ ...card, id: 'gc_123' }],
    })

    await expect(
      getCustomerCreditCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('not a credit card resource')

    expect(server.mapCards).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed list envelope', async () => {
    client.customer.creditCards.list.mockResolvedValue(undefined)

    await expect(
      getCustomerCreditCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('customer list response is malformed')

    expect(server.mapCards).not.toHaveBeenCalled()
  })

  it('rejects a non-card delete id before creating a customer session', () => {
    expect(() =>
      deleteCustomerCreditCard({ data: { id: 'addr_requested', market } }),
    ).toThrow('not a credit card resource')

    expect(server.withCustomerSession).not.toHaveBeenCalled()
    expect(client.customer.creditCards.delete).not.toHaveBeenCalled()
  })

  it('passes a validated card id to the delete mutation', async () => {
    await expect(
      deleteCustomerCreditCard({ data: { id: 'card_requested', market } }),
    ).resolves.toEqual({ success: true })

    expect(client.customer.creditCards.delete).toHaveBeenCalledWith(
      'card_requested',
      { token: 'customer-token' },
    )
  })

  it('fails closed before mapping a card with an incomplete response shape', async () => {
    client.customer.creditCards.list.mockResolvedValue({
      data: [{ id: 'card_incomplete' }],
    })

    await expect(
      getCustomerCreditCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('not a credit card resource')

    expect(server.mapCards).not.toHaveBeenCalled()
  })
})
