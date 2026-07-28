import { Link, createFileRoute } from '@tanstack/react-router'
import { CircleAlert, CircleCheck } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import { verifyNewsletterSubscription } from '@/lib/newsletter/api/subscribe-to-newsletter'
import { AccountAuthShell } from '@/components/account/account-auth-shell'
import { accountInlineLinkClassName } from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { translateMessage } from '@/lib/i18n/messages'
import { buildSeoMeta } from '@/lib/seo/site-seo'

type NewsletterVerificationPageState =
  | {
      status: 'invalid'
    }
  | {
      status: 'unavailable'
    }
  | {
      status: 'unsupported'
    }
  | {
      status: 'verified'
    }

export const Route = createFileRoute('/$country/$locale/newsletter/verify')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: getOptionalTrimmedSearchValue(search.token),
  }),
  loaderDeps: ({ search }) => ({
    token: search.token,
  }),
  loader: async ({ deps }): Promise<NewsletterVerificationPageState> => {
    if (!deps.token) {
      return {
        status: 'invalid',
      }
    }

    try {
      const result = await verifyNewsletterSubscription({
        data: {
          token: deps.token,
        },
      })

      if (result.status === 'verified') {
        return {
          status: 'verified',
        }
      }

      return {
        status: result.status,
      }
    } catch {
      return {
        status: 'unavailable',
      }
    }
  },
  head: ({ params }) => ({
    meta: buildSeoMeta({
      description: translateMessage(
        params.locale,
        'newsletterVerification.description',
      ),
      noIndex: true,
      title: translateMessage(params.locale, 'newsletterVerification.title'),
    }),
  }),
  component: NewsletterVerificationPage,
})

function getOptionalTrimmedSearchValue(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue || undefined
}

function NewsletterVerificationPage() {
  const { status } = Route.useLoaderData()
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  if (status === 'verified') {
    return (
      <AccountAuthShell
        description={t('newsletterVerification.successDescription')}
        supportingContent={
          <p>
            <Link
              className={accountInlineLinkClassName}
              params={marketParams}
              search={{ redirect: undefined }}
              to="/$country/$locale/account/login"
            >
              {t('newsletterVerification.signIn')}
            </Link>{' '}
            {t('newsletterVerification.signInHint')}
          </p>
        }
        title={t('newsletterVerification.successTitle')}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-muted text-foreground">
            <CircleCheck aria-hidden="true" className="h-5 w-5" />
          </div>
          <Link
            className={buttonClassName({ size: 'lg' })}
            params={marketParams}
            to="/$country/$locale"
          >
            {t('newsletterVerification.continueShopping')}
          </Link>
        </div>
      </AccountAuthShell>
    )
  }

  if (status === 'unsupported') {
    return (
      <NewsletterVerificationNotice
        description={t('newsletterVerification.unsupportedDescription')}
        title={t('newsletterVerification.unsupportedTitle')}
      />
    )
  }

  if (status === 'unavailable') {
    return (
      <NewsletterVerificationNotice
        description={t('newsletterVerification.unavailableDescription')}
        title={t('newsletterVerification.unavailableTitle')}
      />
    )
  }

  return (
    <NewsletterVerificationNotice
      description={t('newsletterVerification.invalidDescription')}
      title={t('newsletterVerification.invalidTitle')}
    />
  )
}

function NewsletterVerificationNotice({
  description,
  title,
}: {
  description: string
  title: string
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountAuthShell description={description} title={title}>
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border text-muted-foreground">
          <CircleAlert aria-hidden="true" className="h-5 w-5" />
        </div>
        <Link
          className={buttonClassName({ size: 'lg' })}
          params={marketParams}
          to="/$country/$locale"
        >
          {t('newsletterVerification.continueShopping')}
        </Link>
      </div>
    </AccountAuthShell>
  )
}
