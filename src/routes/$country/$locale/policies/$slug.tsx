import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeading } from '@/components/sections/page-heading'
import { useMarket } from '@/components/layout/market-provider'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

const policies = {
  'privacy-policy': {
    titleKey: 'footer.privacyPolicy',
  },
  'returns-policy': {
    titleKey: 'footer.returnPolicy',
  },
  'shipping-policy': {
    titleKey: 'footer.shippingPolicy',
  },
  'terms-of-service': {
    titleKey: 'footer.termsOfService',
  },
} as const

type PolicySlug = keyof typeof policies

function isPolicySlug(value: string): value is PolicySlug {
  return value in policies
}

export const Route = createFileRoute('/$country/$locale/policies/$slug')({
  loader: ({ params }) => {
    if (!isPolicySlug(params.slug)) {
      throw notFound()
    }

    return policies[params.slug]
  },
  head: ({ loaderData, matches, params }) =>
    buildStorefrontSeoHead({
      description: loaderData
        ? translateMessage(params.locale, 'policy.pendingContent')
        : null,
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: loaderData
        ? translateMessage(params.locale, loaderData.titleKey)
        : translateMessage(params.locale, 'notFound.title'),
    }),
  component: PolicyPage,
})

function PolicyPage() {
  const policy = Route.useLoaderData()
  const { t } = useMarket()

  return (
    <>
      <PageHeading eyebrow={t('footer.getHelp')} title={t(policy.titleKey)} />
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl border-t border-border pt-8">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('policy.pendingContent')}
          </p>
        </div>
      </section>
    </>
  )
}
