import { Link, createFileRoute } from '@tanstack/react-router'

import { AccountAuthShell } from '@/components/account/account-auth-shell'
import { AccountPasswordResetForm } from '@/components/account/account-password-reset-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/forgot-password',
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
      title: translateMessage(params.locale, 'account.resetPassword'),
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
    <AccountAuthShell
      description={t('account.resetPasswordDescription')}
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
      <AccountPasswordResetForm />
    </AccountAuthShell>
  )
}
