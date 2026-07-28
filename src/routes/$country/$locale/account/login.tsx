import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { getCurrentCustomer } from '@/lib/account/api/customer-session.functions'
import { AccountAuthShell } from '@/components/account/account-auth-shell'
import { AccountLoginForm } from '@/components/account/account-login-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'

export const Route = createFileRoute('/$country/$locale/account/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: getOptionalTrimmedSearchValue(search.redirect),
  }),
  loader: async ({ location, params }) => {
    const customer = await getCurrentCustomer()

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

function getOptionalTrimmedSearchValue(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue || undefined
}

function resolveAccountRedirectTarget(
  params: { country: string; locale: string },
  redirectTarget?: string,
) {
  const fallback = `/${params.country}/${params.locale}/account`
  const localizedPrefix = `/${params.country}/${params.locale}`
  const allowedPrefixes = [
    `${localizedPrefix}/account`,
    `${localizedPrefix}/checkout`,
  ]

  if (!redirectTarget) {
    return fallback
  }

  if (
    !allowedPrefixes.some((prefix) =>
      isSamePathOrDescendant(redirectTarget, prefix),
    ) ||
    redirectTarget.startsWith('//') ||
    redirectTarget.includes('\\')
  ) {
    return fallback
  }

  return redirectTarget
}

function isSamePathOrDescendant(target: string, prefix: string) {
  return (
    target === prefix ||
    target.startsWith(`${prefix}/`) ||
    target.startsWith(`${prefix}?`) ||
    target.startsWith(`${prefix}#`)
  )
}

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
    <AccountAuthShell
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
      title={t('account.welcomeBack')}
    >
      <AccountLoginForm
        redirectTo={resolveAccountRedirectTarget(marketParams, redirectTarget)}
      />
    </AccountAuthShell>
  )
}
