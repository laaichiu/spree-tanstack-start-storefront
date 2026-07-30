import { createFileRoute } from '@tanstack/react-router'

import { getCustomerCreditCards } from '@/lib/account/api/customer-credit-card.functions'
import { AccountPaymentMethodsList } from '@/components/account/account-payment-methods-list'
import { AccountSectionShell } from '@/components/account/account-section-shell'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/credit-cards',
)({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'account.paymentMethods'),
    }),
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
