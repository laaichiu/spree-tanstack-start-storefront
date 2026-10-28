import { createFileRoute } from '@tanstack/react-router'

import { getCustomerAddresses } from '@/lib/account/api/customer-address.functions'
import { AccountAddressesList } from '@/components/account/account-addresses-list'
import { AccountSectionShell } from '@/components/account/account-section-shell'
import { redirectToAccountLogin } from '@/lib/account/api/auth-guard'
import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/addresses',
)({
  loader: async ({ location, params }) => {
    try {
      const addresses = await getCustomerAddresses({
        data: {
          params: {
            limit: 50,
            page: 1,
          },
          market: {
            country: params.country,
            locale: params.locale,
          },
        },
      })

      return {
        addresses,
        loadError: false,
      }
    } catch (error) {
      if (isCustomerSessionRequiredError(error)) {
        return redirectToAccountLogin(params, location)
      }

      return {
        addresses: [],
        loadError: true,
      }
    }
  },
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'account.addresses'),
    }),
  component: AccountAddressesPage,
})

function AccountAddressesPage() {
  const { addresses, loadError } = Route.useLoaderData()

  return (
    <AccountSectionShell activeSection="addresses">
      <AccountAddressesList addresses={addresses} loadError={loadError} />
    </AccountSectionShell>
  )
}
