import { createFileRoute } from '@tanstack/react-router'

import { AccountProfileDetails } from '@/components/account/account-profile-details'
import { AccountSectionShell } from '@/components/account/account-section-shell'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/',
)({
  component: AccountOverviewPage,
})

function AccountOverviewPage() {
  return (
    <AccountSectionShell activeSection="profile">
      <AccountProfileDetails />
    </AccountSectionShell>
  )
}
