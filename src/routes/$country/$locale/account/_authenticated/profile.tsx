import { createFileRoute } from '@tanstack/react-router'

import { AccountProfileDetails } from '@/components/account/account-profile-details'
import { AccountSectionShell } from '@/components/account/account-section-shell'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/profile',
)({
  component: AccountProfilePage,
})

function AccountProfilePage() {
  return (
    <AccountSectionShell activeSection="profile">
      <AccountProfileDetails />
    </AccountSectionShell>
  )
}
