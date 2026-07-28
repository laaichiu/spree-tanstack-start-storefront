import { createFileRoute } from '@tanstack/react-router'

import { getCustomerGiftCards } from '@/lib/account/api/customer-gift-card.functions'
import { AccountGiftCardsList } from '@/components/account/account-gift-cards-list'
import { AccountSectionShell } from '@/components/account/account-section-shell'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/gift-cards',
)({
  loader: async () => {
    try {
      const cards = await getCustomerGiftCards({
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
  component: AccountGiftCardsPage,
})

function AccountGiftCardsPage() {
  const { cards, loadError } = Route.useLoaderData()

  return (
    <AccountSectionShell activeSection="giftCards">
      <AccountGiftCardsList cards={cards} loadError={loadError} />
    </AccountSectionShell>
  )
}
