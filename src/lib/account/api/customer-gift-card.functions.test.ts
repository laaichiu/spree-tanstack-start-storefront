// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCustomerGiftCards } from './customer-gift-card.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapCards: vi.fn(),
  resolveServerMarket: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const client = {
  customer: {
    giftCards: {
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

vi.mock('@/lib/account/mappers/customer-gift-card.mapper', () => ({
  mapSpreeGiftCardsToCustomerGiftCards: server.mapCards,
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

describe('customer gift-card response boundary', () => {
  const giftCard = {
    active: true,
    amount: '100.00',
    amount_authorized: null,
    amount_remaining: '100.00',
    amount_used: '0.00',
    code: 'GIFT-CARD-REQUESTED',
    currency: 'USD',
    display_amount: '$100.00',
    display_amount_remaining: '$100.00',
    display_amount_used: '$0.00',
    expired: false,
    expires_at: null,
    id: 'gc_requested',
    redeemed_at: null,
    status: 'active',
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

  it('validates every gift card in a list before mapping', async () => {
    const cards = [
      { ...giftCard, id: 'gc_first' },
      { ...giftCard, currency: 'usd', id: 'gc_second' },
    ]
    const mappedCards = [{ id: 'gc_first' }, { id: 'gc_second' }]
    client.customer.giftCards.list.mockResolvedValue({ data: cards })
    server.mapCards.mockReturnValue(mappedCards)

    await expect(
      getCustomerGiftCards({ data: { market, params: undefined } }),
    ).resolves.toBe(mappedCards)

    expect(server.resolveServerMarket).toHaveBeenCalledWith(market)
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
    expect(server.mapCards).toHaveBeenCalledWith(cards, 'en')
  })

  it('fails closed before mapping a non-gift-card list response', async () => {
    client.customer.giftCards.list.mockResolvedValue({
      data: [{ id: 'card_123' }],
    })

    await expect(
      getCustomerGiftCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('not a gift card resource')

    expect(server.mapCards).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed list envelope', async () => {
    client.customer.giftCards.list.mockResolvedValue({ data: 'not-an-array' })

    await expect(
      getCustomerGiftCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('customer list response is malformed')

    expect(server.mapCards).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a gift card from another currency', async () => {
    client.customer.giftCards.list.mockResolvedValue({
      data: [{ ...giftCard, currency: 'EUR', id: 'gc_eu' }],
    })

    await expect(
      getCustomerGiftCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('does not match the current market currency')

    expect(server.mapCards).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a gift card with an incomplete response shape', async () => {
    client.customer.giftCards.list.mockResolvedValue({
      data: [{ ...giftCard, amount: undefined }],
    })

    await expect(
      getCustomerGiftCards({ data: { market, params: undefined } }),
    ).rejects.toThrow('not a gift card resource')

    expect(server.mapCards).not.toHaveBeenCalled()
  })
})
