import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentCustomer } from '@/lib/account/api/customer-session.functions'
import { AccountLoginForm } from '@/components/account/account-login-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui-view'
import { resolveAccountRedirectTarget } from '@/lib/account/utils/account-redirect'
import { useMarket } from '@/components/layout/market-provider'
import { parseOptionalTrimmedSearchText } from '@/lib/core/optional-search-text'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'
import { AccountAuthShellView } from '@/components/account/account-auth-shell-view'

export const Route = createFileRoute('/$country/$locale/account/login')({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: getMessageFromMatches(matches, 'account.account'),
    }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: parseOptionalTrimmedSearchText(search.redirect),
  }),
  loader: async ({ location, params }) => {
    const customer = await getCurrentCustomer({
      data: {
        country: params.country,
        locale: params.locale,
      },
    })

    if (!customer) {
      return null
    }

    throw redirect({
      href: resolveAccountRedirectTarget(
        params,
        getRedirectFromLocation(location),
      ),
      replace: true,
    })
  },
  component: AccountLoginPage,
})

function getRedirectFromLocation(location: { searchStr?: string }) {
  if (!location.searchStr) {
    return undefined
  }

  return new URLSearchParams(location.searchStr).get('redirect') ?? undefined
}

function AccountLoginPage() {
  const { redirect: redirectTarget } = Route.useSearch()
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountAuthShellView
      model={{ title: t('account.signIn') }}
      supportingContent={
        <p>
          {t('account.dontHaveAccount')}{' '}
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/register"
          >
            {t('account.signUp')}
          </Link>
        </p>
      }
    >
      <AccountLoginForm
        redirectTo={resolveAccountRedirectTarget(marketParams, redirectTarget)}
      />
    </AccountAuthShellView>
  )
}
