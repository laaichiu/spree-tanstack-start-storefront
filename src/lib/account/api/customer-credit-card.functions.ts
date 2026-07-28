import type { ListParams } from '@spree/sdk'
import { createServerFn } from '@tanstack/react-start'

import { mapSpreeCreditCardsToCustomerCreditCards } from '@/lib/account/mappers/customer-credit-card.mapper'
import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'

export const getCustomerCreditCards = createServerFn({ method: 'GET' })
  .validator((data: { params?: ListParams } | undefined) => ({
    params: data?.params,
  }))
  .handler(async ({ data }): Promise<Array<CustomerCreditCard>> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      const response = await client.customer.creditCards.list(data.params, {
        token,
      })

      return mapSpreeCreditCardsToCustomerCreditCards(response.data)
    })
  })

function parseRequiredText(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new Error(`${field} is required.`)
  }

  return normalized
}

export const deleteCustomerCreditCard = createServerFn({ method: 'POST' })
  .validator((data: { id: string }) => ({
    id: parseRequiredText(data.id, 'Credit card ID'),
  }))
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { withCustomerSession } = await import('./customer-session.server')

    return withCustomerSession(async ({ client, token }) => {
      await client.customer.creditCards.delete(data.id, { token })

      return {
        success: true,
      }
    })
  })
