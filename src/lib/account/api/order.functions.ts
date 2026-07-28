import type { OrderListParams } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import {
  mapSpreeOrderToDetail,
  mapSpreeOrdersToSummaries,
} from '@/lib/account/mappers/order.mapper'
import type { OrderDetail, OrderSummary } from '@/lib/account/model/order'

export const getCustomerOrderSummaries = createServerFn({ method: 'GET' })
  .validator((data: { params?: OrderListParams } | undefined) => ({
    params: data?.params,
  }))
  .handler(async ({ data }): Promise<Array<OrderSummary>> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const response = await client.customer.orders.list(data.params, {
        token,
      })

      return mapSpreeOrdersToSummaries(response.data)
    })
  })

function parseRequiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error(`${field} is required.`)
  }

  return normalized
}

export const getCustomerOrderDetail = createServerFn({ method: 'GET' })
  .validator((data: { orderId: string }) => ({
    orderId: parseRequiredText(data.orderId, 'Order ID'),
  }))
  .handler(async ({ data }): Promise<OrderDetail> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
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

      return mapSpreeOrderToDetail(order)
    })
  })
