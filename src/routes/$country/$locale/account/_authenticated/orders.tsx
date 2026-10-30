import { Outlet, createFileRoute } from '@tanstack/react-router'

import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders',
)({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: getMessageFromMatches(matches, 'account.orders'),
    }),
  component: AccountOrdersLayout,
})

function AccountOrdersLayout() {
  return <Outlet />
}
