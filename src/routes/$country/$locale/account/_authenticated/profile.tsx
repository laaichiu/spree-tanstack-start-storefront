import { createFileRoute } from '@tanstack/react-router'

import { AccountProfileDetails } from '@/components/account/account-profile-details'
import { AccountSectionShell } from '@/components/account/account-section-shell'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/profile',
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
      title: translateMessage(params.locale, 'account.account'),
    }),
  component: AccountProfilePage,
})

function AccountProfilePage() {
  return (
    <AccountSectionShell activeSection="profile">
      <AccountProfileDetails />
    </AccountSectionShell>
  )
}
