import { Link, createFileRoute } from '@tanstack/react-router'

import { AccountPasswordResetForm } from '@/components/account/account-password-reset-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui-view'
import { useMarket } from '@/components/layout/market-provider'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'
import { AccountAuthShellView } from '@/components/account/account-auth-shell-view'

export const Route = createFileRoute(
  '/$country/$locale/account/forgot-password',
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
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountAuthShellView
      model={{
        description: t('account.resetPasswordDescription'),
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
      <AccountPasswordResetForm />
    </AccountAuthShellView>
  )
}
