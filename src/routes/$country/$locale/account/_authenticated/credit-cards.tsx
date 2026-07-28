import { createFileRoute } from '@tanstack/react-router'

import { getCustomerCreditCards } from '@/lib/account/api/customer-credit-card.functions'
import { AccountPaymentMethodsList } from '@/components/account/account-payment-methods-list'
import { AccountSectionShell } from '@/components/account/account-section-shell'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/credit-cards',
)({
  loader: async () => {
    try {
      const cards = await getCustomerCreditCards({
        data: {
          params: {
            limit: 50,
            page: 1,
          },
        },
      })

      return {
        cards,
        loadError: false,
      }
    } catch {
      return {
        cards: [],
        loadError: true,
      }
    }
  },
  component: AccountCreditCardsPage,
})

function AccountCreditCardsPage() {
  const { cards, loadError } = Route.useLoaderData()

  return (
    <AccountSectionShell activeSection="paymentMethods">
      <AccountPaymentMethodsList cards={cards} loadError={loadError} />
    </AccountSectionShell>
  )
}
