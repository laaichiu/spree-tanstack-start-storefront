import { Link, createFileRoute } from '@tanstack/react-router'

import { AccountAuthShell } from '@/components/account/account-auth-shell'
import { AccountRegisterForm } from '@/components/account/account-register-form'
import { accountInlineLinkClassName } from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/account/register')({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'account.createAccount'),
    }),
  component: AccountRegisterPage,
})

function AccountRegisterPage() {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountAuthShell
      footer={
        <p>
          {t('account.accountConsentPrefix')}{' '}
          <Link
            className={accountInlineLinkClassName}
            params={{ ...marketParams, slug: 'terms-of-service' }}
            to="/$country/$locale/policies/$slug"
          >
            {t('footer.termsOfService')}
          </Link>{' '}
          {t('account.accountConsentAnd')}{' '}
          <Link
            className={accountInlineLinkClassName}
            params={{ ...marketParams, slug: 'privacy-policy' }}
            to="/$country/$locale/policies/$slug"
          >
            {t('footer.privacyPolicy')}
          </Link>
          .
        </p>
      }
      supportingContent={
        <p>
          {t('account.alreadyHaveAccount')}{' '}
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/login"
          >
            {t('account.signIn')}
          </Link>
        </p>
      }
      title={t('account.createAccount')}
    >
      <AccountRegisterForm />
    </AccountAuthShell>
  )
}
