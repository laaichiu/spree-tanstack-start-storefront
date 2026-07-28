import { Link, createFileRoute } from '@tanstack/react-router'
import { CircleAlert } from 'lucide-react'

import { AccountAuthShell } from '@/components/account/account-auth-shell'
import { AccountResetPasswordForm } from '@/components/account/account-reset-password-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'

export const Route = createFileRoute(
  '/$country/$locale/account/reset-password',
)({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: getOptionalTrimmedSearchValue(search.token),
  }),
  component: AccountResetPasswordPage,
})

function getOptionalTrimmedSearchValue(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue || undefined
}

function AccountResetPasswordPage() {
  const { token } = Route.useSearch()
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  if (!token) {
    return (
      <AccountAuthShell
        description={t('account.resetPasswordInvalidLinkDescription')}
        supportingContent={
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/forgot-password"
          >
            {t('account.requestNewResetLink')}
          </Link>
        }
        title={t('account.resetPasswordInvalidLink')}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-destructive text-destructive">
            <CircleAlert aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="text-sm leading-6 mx-auto max-w-md text-muted-foreground">
            {t('account.resetPasswordInvalidLinkDescription')}
          </p>
        </div>
      </AccountAuthShell>
    )
  }

  return (
    <AccountAuthShell
      description={t('account.resetPasswordFormDescription')}
      supportingContent={
        <Link
          className={accountInlineLinkClassName}
          params={marketParams}
          to="/$country/$locale/account/login"
        >
          {t('account.backToSignIn')}
        </Link>
      }
      title={t('account.resetPassword')}
    >
      <AccountResetPasswordForm token={token} />
    </AccountAuthShell>
  )
}
