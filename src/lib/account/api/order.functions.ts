import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { marketInputSchema } from '@/lib/market/utils/market-input'
import { assertSpreeCartResourceMatchesMarket } from '@/lib/cart/utils/cart-market'
import {
  mapSpreeOrderToDetail,
  mapSpreeOrdersToSummaries,
} from '@/lib/account/mappers/order.mapper'
import type { OrderDetail, OrderSummary } from '@/lib/account/contracts'
import {
  assertCustomerOrderResourceIsOrder,
  assertCustomerOrderResourceMatchesId,
} from '../utils/order-identity'
import { assertCustomerOrderDetailResponse } from '../utils/order-detail-response'
import { assertCustomerListResponse } from '../utils/customer-list-response'
import { assertCustomerOrderSummaryResponse } from '../utils/order-summary-response'
import { parseCustomerListParams } from './customer-list-params'
import { getCustomerRequestRecord } from './customer-request-record'

export const getCustomerOrderSummaries = createServerFn({ method: 'GET' })
  .validator((data: unknown) => parseCustomerOrderListRequest(data))
  .handler(async ({ data }): Promise<Array<OrderSummary>> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        const response = await client.customer.orders.list(data.params, {
          token,
        })

        assertCustomerListResponse(response)
        response.data.forEach((order) => {
          assertCustomerOrderResourceIsOrder(order)
          assertCustomerOrderSummaryResponse(order)
          assertSpreeCartResourceMatchesMarket(order, market)
        })

        return mapSpreeOrdersToSummaries(response.data, market.locale)
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

function parseRequiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error(`${field} is required.`)
  }

  return normalized
}

function parseRequiredOrderId(value: unknown) {
  const orderId = parseRequiredText(value, 'Order ID')

  assertCustomerOrderResourceMatchesId({ id: orderId }, orderId)

  return orderId
}

export const getCustomerOrderDetail = createServerFn({ method: 'GET' })
  .validator((data: unknown) => parseCustomerOrderDetailRequest(data))
  .handler(async ({ data }): Promise<OrderDetail> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        const order = await client.customer.orders.get(
          data.orderId,
          {
            expand: [
              'items',
              'fulfillments',
              'payments',
              'billing_address',
              'shipping_address',
              'gift_card',
            ],
          },
          { token },
        )

        assertCustomerOrderResourceMatchesId(order, data.orderId)
        assertCustomerOrderSummaryResponse(order)
        assertCustomerOrderDetailResponse(order)
        assertSpreeCartResourceMatchesMarket(order, market)

        return mapSpreeOrderToDetail(order, market.locale)
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

function parseCustomerOrderListRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer order request is required.')
  }

  return {
    market: marketInputSchema.parse(request.market),
    params: parseCustomerListParams(request.params, [
      'completed_at',
      'created_at',
      'id',
      'number',
      'total',
      'updated_at',
    ] as const),
  }
}

function parseCustomerOrderDetailRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer order request is required.')
  }

  return {
    market: marketInputSchema.parse(request.market),
    orderId: parseRequiredOrderId(request.orderId),
  }
}
