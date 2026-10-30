import { Link, createFileRoute } from '@tanstack/react-router'

import { AccountResetPasswordForm } from '@/components/account/account-reset-password-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui-view'
import { useMarket } from '@/components/layout/market-provider'
import { AccountPasswordResetInvalidLinkView } from '@/components/account/account-password-reset-invalid-link-view'
import { parseOptionalTrimmedSearchText } from '@/lib/core/optional-search-text'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'
import { AccountAuthShellView } from '@/components/account/account-auth-shell-view'

export const Route = createFileRoute(
  '/$country/$locale/account/reset-password',
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
      title: getMessageFromMatches(matches, 'account.resetPassword'),
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: parseOptionalTrimmedSearchText(search.token),
  }),
  component: AccountResetPasswordPage,
})

function AccountResetPasswordPage() {
  const { token } = Route.useSearch()
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  if (!token) {
    return (
      <AccountAuthShellView
        model={{
          description: t('account.resetPasswordInvalidLinkDescription'),
          title: t('account.resetPasswordInvalidLink'),
        }}
        supportingContent={
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/forgot-password"
          >
            {t('account.requestNewResetLink')}
          </Link>
        }
      >
        <AccountPasswordResetInvalidLinkView
          description={t('account.resetPasswordInvalidLinkDescription')}
        />
      </AccountAuthShellView>
    )
  }

  return (
    <AccountAuthShellView
      model={{
        description: t('account.resetPasswordFormDescription'),
        title: t('account.resetPassword'),
      }}
      supportingContent={
        <Link
          className={accountInlineLinkClassName}
          params={marketParams}
          to="/$country/$locale/account/login"
        >
          {t('account.backToSignIn')}
        </Link>
      }
    >
      <AccountResetPasswordForm token={token} />
    </AccountAuthShellView>
  )
}
