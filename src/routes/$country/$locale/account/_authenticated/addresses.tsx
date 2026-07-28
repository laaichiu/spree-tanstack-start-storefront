import { createFileRoute } from '@tanstack/react-router'

import { getCustomerAddresses } from '@/lib/account/api/customer-address.functions'
import { AccountAddressesList } from '@/components/account/account-addresses-list'
import { AccountSectionShell } from '@/components/account/account-section-shell'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/addresses',
)({
  loader: async () => {
    try {
      const addresses = await getCustomerAddresses({
        data: {
          params: {
            limit: 50,
            page: 1,
          },
        },
      })

      return {
        addresses,
        loadError: false,
      }
    } catch {
      return {
        addresses: [],
        loadError: true,
      }
    }
  },
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
