import { createFileRoute, notFound } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { PolicyPageView } from '@/components/policies/policy-page-view'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
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
  return Object.hasOwn(policies, value)
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
        ? getMessageFromMatches(matches, 'policy.pendingContent')
        : null,
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: loaderData
        ? getMessageFromMatches(matches, loaderData.titleKey)
        : getMessageFromMatches(matches, 'notFound.title'),
    }),
  component: PolicyPage,
})

function PolicyPage() {
  const policy = Route.useLoaderData()
  const { t } = useMarket()

  return (
    <PolicyPageView
      model={{
        content: t('policy.pendingContent'),
        eyebrow: t('footer.getHelp'),
        title: t(policy.titleKey),
      }}
    />
  )
}
