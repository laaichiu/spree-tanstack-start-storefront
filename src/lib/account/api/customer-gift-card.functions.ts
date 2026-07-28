import type { ListParams } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import { mapSpreeGiftCardsToCustomerGiftCards } from '@/lib/account/mappers/customer-gift-card.mapper'
import type { CustomerGiftCard } from '@/lib/account/model/customer-gift-card'

export const getCustomerGiftCards = createServerFn({ method: 'GET' })
  .validator((data: { params?: ListParams } | undefined) => ({
    params: data?.params,
  }))
  .handler(async ({ data }): Promise<Array<CustomerGiftCard>> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const response = await client.customer.giftCards.list(data.params, {
        token,
      })

      return mapSpreeGiftCardsToCustomerGiftCards(response.data)
    })
  })
