import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { marketInputSchema } from '@/lib/market/utils/market-input'
import { mapSpreeCreditCardsToCustomerCreditCards } from '@/lib/account/mappers/customer-credit-card.mapper'
import type { CustomerCreditCard } from '@/lib/account/contracts'
import {
  assertCustomerCreditCardId,
  assertCustomerCreditCardResourceIsCreditCard,
} from '../utils/credit-card-identity'
import { assertCustomerListResponse } from '../utils/customer-list-response'
import { parseCustomerListParams } from './customer-list-params'
import { getCustomerRequestRecord } from './customer-request-record'

export const getCustomerCreditCards = createServerFn({ method: 'GET' })
  .validator((data: unknown) => parseCustomerCreditCardListRequest(data))
  .handler(async ({ data }): Promise<Array<CustomerCreditCard>> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        const response = await client.customer.creditCards.list(data.params, {
          token,
        })

        assertCustomerListResponse(response)
        response.data.forEach(assertCustomerCreditCardResourceIsCreditCard)

        return mapSpreeCreditCardsToCustomerCreditCards(response.data)
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

function parseRequiredCreditCardId(value: unknown) {
  const id = parseRequiredText(value, 'Credit card ID')

  assertCustomerCreditCardId(id)

  return id
}

export const deleteCustomerCreditCard = createServerFn({ method: 'POST' })
  .validator((data: unknown) => parseCustomerCreditCardDeleteRequest(data))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        await client.customer.creditCards.delete(data.id, { token })

        return {
          success: true,
        }
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

function parseCustomerCreditCardListRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer credit-card request is required.')
  }

  return {
    market: marketInputSchema.parse(request.market),
    params: parseCustomerListParams(request.params, [
      'created_at',
      'id',
      'name',
      'updated_at',
    ] as const),
  }
}

function parseCustomerCreditCardDeleteRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer credit-card request is required.')
  }

  return {
    id: parseRequiredCreditCardId(request.id),
    market: marketInputSchema.parse(request.market),
  }
}
