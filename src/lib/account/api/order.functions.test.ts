// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCustomerOrderDetail,
  getCustomerOrderSummaries,
} from './order.functions'

const server = vi.hoisted(() => ({
  getServerSpreeClientForMarket: vi.fn(),
  mapDetail: vi.fn(),
  mapSummaries: vi.fn(),
  resolveServerMarket: vi.fn(),
  withCustomerSession: vi.fn(),
}))

const client = {
  customer: {
    orders: {
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

vi.mock('@/lib/account/mappers/order.mapper', () => ({
  mapSpreeOrderToDetail: server.mapDetail,
  mapSpreeOrdersToSummaries: server.mapSummaries,
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

function orderResource(id: string) {
  return {
    completed_at: '2026-08-27T00:00:00Z',
    currency: 'USD',
    total: '10.00',
    fulfillment_status: 'fulfilled',
    fulfillments: [],
    id,
    items: [],
    market_id: 'market-us',
    number: 'R123',
    payments: [],
    payment_status: 'paid',
    total_quantity: 1,
  }
}

function orderDetailResource(id: string) {
  return {
    ...orderResource(id),
    amount_due: '0.00',
    billing_address: {
      address1: '1 Main Street',
      address2: null,
      city: 'Boston',
      company: null,
      country_code: 'US',
      full_name: 'Ada Lovelace',
      phone: null,
      postal_code: '02108',
      state_text: 'Massachusetts',
    },
    customer_note: null,
    discount_total: '0.00',

    delivery_total: '5.00',

    item_total: '10.00',

    fulfillments: [
      {
        delivery_method: { id: 'dm_delivery', name: 'Delivery' },
        cost: '5.00',
        fulfilled_at: null,
        id: 'ful_delivery',
        items: [
          { item_id: 'li_item', quantity: 1, variant_id: 'variant_item' },
        ],
        number: 'F123',
        status: 'fulfilled',
        stock_location: {
          city: null,
          country_code: null,
          id: 'sloc_warehouse',
          name: 'Warehouse',
          state_code: null,
          state_text: null,
        },
        tracking: null,
        tracking_url: null,
      },
    ],
    items: [
      {
        price: '10.00',
        total: '10.00',
        id: 'li_item',
        name: 'Product',
        options_text: '',
        quantity: 1,
        slug: 'product',
        thumbnail_url: null,
        variant_id: 'variant_item',
      },
    ],
    payments: [
      {
        amount: '10.00',
        id: 'py_payment',
        number: 'P123',
        payment_method: { id: 'pm_card', name: 'Card' },
        payment_method_id: 'pm_card',
        response_code: null,
        source: null,
        source_id: null,
        source_type: null,
        status: 'completed',
      },
    ],
    gift_card_total: '0.00',
    shipping_address: {
      address1: '1 Main Street',
      address2: null,
      city: 'Boston',
      company: null,
      country_code: 'US',
      full_name: 'Ada Lovelace',
      phone: null,
      postal_code: '02108',
      state_text: 'Massachusetts',
    },
    store_credit_total: '0.00',
    tax_total: '0.00',
  }
}

describe('customer order detail boundary', () => {
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

  it('does not map a response for another requested order', async () => {
    client.customer.orders.get.mockResolvedValue(orderResource('or_other'))

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('does not match the requested order')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it('rejects a cart-shaped order id before calling the customer session', () => {
    expect(() =>
      getCustomerOrderDetail({ data: { market, orderId: 'cart_requested' } }),
    ).toThrow('does not match the requested order')

    expect(server.withCustomerSession).not.toHaveBeenCalled()
    expect(client.customer.orders.get).not.toHaveBeenCalled()
  })

  it('maps the response only after its identity matches', async () => {
    const order = orderDetailResource('or_requested')
    const mappedOrder = { id: 'or_requested' }
    client.customer.orders.get.mockResolvedValue(order)
    server.mapDetail.mockReturnValue(mappedOrder)

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).resolves.toBe(mappedOrder)

    expect(server.mapDetail).toHaveBeenCalledWith(order, 'en')
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
  })

  it('does not map a detail response from another market', async () => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      currency: 'EUR',
      market_id: 'market-eu',
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('different market')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it.each([
    ['items', { items: null }],
    ['fulfillments', { fulfillments: null }],
    ['payments', { payments: null }],
  ])(
    'rejects a malformed detail %s collection before mapping',
    async (_, patch) => {
      client.customer.orders.get.mockResolvedValue({
        ...orderDetailResource('or_requested'),
        ...patch,
      })

      await expect(
        getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
      ).rejects.toThrow('customer order detail response is malformed')

      expect(server.mapDetail).not.toHaveBeenCalled()
    },
  )

  it('rejects a fulfillment item that is not owned by the order', async () => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      fulfillments: [
        {
          ...orderDetailResource('or_requested').fulfillments[0],
          items: [
            {
              item_id: 'li_other_order',
              quantity: 1,
              variant_id: 'variant_item',
            },
          ],
        },
      ],
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('contains an unrelated resource')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it('rejects a payment whose method does not match its method id', async () => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      payments: [
        {
          ...orderDetailResource('or_requested').payments[0],
          payment_method: { id: 'pm_other', name: 'Other' },
        },
      ],
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('contains an unrelated resource')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it('maps a payment with a canonical non-card source identity', async () => {
    const order = orderDetailResource('or_requested')
    const response = {
      ...order,
      payments: [
        {
          ...order.payments[0],
          source: { id: 'psrc_wallet', gateway_payment_profile_id: null },
          source_id: 'psrc_wallet',
          source_type: 'payment_source',
        },
      ],
    }
    client.customer.orders.get.mockResolvedValue(response)

    await getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } })

    expect(server.mapDetail).toHaveBeenCalledWith(response, 'en')
  })

  it.each([
    [
      'session identity',
      {
        source: { id: 'ps_wallet', gateway_payment_profile_id: null },
        source_id: 'ps_wallet',
        source_type: 'payment_source',
      },
      'is malformed',
    ],
    [
      'empty source identity',
      {
        source: { id: 'psrc_', gateway_payment_profile_id: null },
        source_id: 'psrc_',
        source_type: 'payment_source',
      },
      'is malformed',
    ],
    [
      'another source',
      {
        source: { id: 'psrc_other', gateway_payment_profile_id: null },
        source_id: 'psrc_wallet',
        source_type: 'payment_source',
      },
      'contains an unrelated resource',
    ],
    [
      'missing expanded source',
      { source_id: 'psrc_wallet' },
      'contains an unrelated resource',
    ],
    ['missing source id', { source_id: undefined }, 'is malformed'],
  ])('rejects %s before mapping a payment', async (_, patch, message) => {
    const order = orderDetailResource('or_requested')
    client.customer.orders.get.mockResolvedValue({
      ...order,
      payments: [{ ...order.payments[0], ...patch }],
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow(message)

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it.each([
    ['city', { city: 42 }],
    ['country code', { country_code: 42 }],
    ['state abbreviation', { state_code: 42 }],
    ['state text', { state_text: 42 }],
  ])(
    'rejects a fulfillment stock location with malformed %s before mapping',
    async (_, stockLocationPatch) => {
      const fulfillment = orderDetailResource('or_requested').fulfillments[0]

      client.customer.orders.get.mockResolvedValue({
        ...orderDetailResource('or_requested'),
        fulfillments: [
          {
            ...fulfillment,
            stock_location: {
              ...fulfillment.stock_location,
              ...stockLocationPatch,
            },
          },
        ],
      })

      await expect(
        getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
      ).rejects.toThrow('customer order detail response is malformed')

      expect(server.mapDetail).not.toHaveBeenCalled()
    },
  )

  it.each([
    [
      'line item',
      {
        items: [
          {
            ...orderDetailResource('or_requested').items[0],
            quantity: 1.5,
          },
        ],
      },
    ],
    [
      'fulfillment item',
      {
        fulfillments: [
          {
            ...orderDetailResource('or_requested').fulfillments[0],
            items: [
              {
                item_id: 'li_item',
                quantity: 1.5,
                variant_id: 'variant_item',
              },
            ],
          },
        ],
      },
    ],
  ])('rejects a fractional %s quantity before mapping', async (_, patch) => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      ...patch,
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('customer order detail response is malformed')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })
})

describe('customer order list boundary', () => {
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

  it('maps only responses with order resource identities', async () => {
    const orders = [orderResource('or_first'), orderResource('or_second')]
    const mappedOrders = [{ id: 'or_first' }]
    client.customer.orders.list.mockResolvedValue({ data: orders })
    server.mapSummaries.mockReturnValue(mappedOrders)

    await expect(
      getCustomerOrderSummaries({ data: { market, params: undefined } }),
    ).resolves.toBe(mappedOrders)

    expect(server.mapSummaries).toHaveBeenCalledWith(orders, 'en')
    expect(server.getServerSpreeClientForMarket).toHaveBeenCalledWith(
      resolvedMarket,
    )
  })

  it('fails closed before mapping a cart-shaped list response', async () => {
    client.customer.orders.list.mockResolvedValue({
      data: [{ id: 'cart_123' }],
    })

    await expect(
      getCustomerOrderSummaries({ data: { market, params: undefined } }),
    ).rejects.toThrow('not an order resource')

    expect(server.mapSummaries).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a malformed list envelope', async () => {
    client.customer.orders.list.mockResolvedValue(null)

    await expect(
      getCustomerOrderSummaries({ data: { market, params: undefined } }),
    ).rejects.toThrow('customer list response is malformed')

    expect(server.mapSummaries).not.toHaveBeenCalled()
  })

  it('does not map a list response containing another market order', async () => {
    client.customer.orders.list.mockResolvedValue({
      data: [
        orderResource('or_first'),
        {
          ...orderResource('or_eu'),
          currency: 'EUR',
          market_id: 'market-eu',
        },
      ],
    })

    await expect(
      getCustomerOrderSummaries({ data: { market, params: undefined } }),
    ).rejects.toThrow('different market')

    expect(server.mapSummaries).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a list response with an incomplete summary shape', async () => {
    client.customer.orders.list.mockResolvedValue({
      data: [{ ...orderResource('or_incomplete'), number: undefined }],
    })

    await expect(
      getCustomerOrderSummaries({ data: { market, params: undefined } }),
    ).rejects.toThrow('customer order summary response is malformed')

    expect(server.mapSummaries).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a detail response with incomplete top-level fields', async () => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      total: undefined,
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('customer order summary response is malformed')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })

  it('fails closed before mapping a detail response with a malformed address', async () => {
    client.customer.orders.get.mockResolvedValue({
      ...orderDetailResource('or_requested'),
      billing_address: {
        ...orderDetailResource('or_requested').billing_address,
        full_name: undefined,
      },
    })

    await expect(
      getCustomerOrderDetail({ data: { market, orderId: 'or_requested' } }),
    ).rejects.toThrow('customer order detail response is malformed')

    expect(server.mapDetail).not.toHaveBeenCalled()
  })
})
