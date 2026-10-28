import { createServerFn } from '@tanstack/react-start'

import { marketInputSchema } from '@/lib/market/utils/market-input'
import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import { mapSpreeGiftCardsToCustomerGiftCards } from '@/lib/account/mappers/customer-gift-card.mapper'
import type { CustomerGiftCard } from '@/lib/account/contracts'
import { assertCustomerGiftCardResourceIsGiftCard } from '../utils/gift-card-identity'
import { assertCustomerGiftCardMatchesMarket } from '../utils/gift-card-market'
import { assertCustomerListResponse } from '../utils/customer-list-response'
import { parseCustomerListParams } from './customer-list-params'
import { getCustomerRequestRecord } from './customer-request-record'

export const getCustomerGiftCards = createServerFn({ method: 'GET' })
  .validator((data: unknown) => parseCustomerGiftCardListRequest(data))
  .handler(async ({ data }): Promise<Array<CustomerGiftCard>> => {
    const { getServerSpreeClientForMarket } =
      await import('@/lib/spree/client.server')
    const { withCustomerSession } = await import('./customer-session.server')
    const market = await resolveServerMarket(data.market)

    return withCustomerSession(
      async ({ client, token }) => {
        const response = await client.customer.giftCards.list(data.params, {
          token,
        })

        assertCustomerListResponse(response)
        response.data.forEach((giftCard) => {
          assertCustomerGiftCardResourceIsGiftCard(giftCard)
          assertCustomerGiftCardMatchesMarket(giftCard, market)
        })

        return mapSpreeGiftCardsToCustomerGiftCards(
          response.data,
          market.locale,
        )
      },
      { client: getServerSpreeClientForMarket(market) },
    )
  })

function parseCustomerGiftCardListRequest(data: unknown) {
  const request = getCustomerRequestRecord(data)

  if (!request) {
    throw new Error('Customer gift-card request is required.')
  }

  return {
    market: marketInputSchema.parse(request.market),
    params: parseCustomerListParams(request.params, [
      'created_at',
      'id',
      'updated_at',
    ] as const),
  }
}
