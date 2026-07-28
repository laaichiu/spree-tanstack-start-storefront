import { createFileRoute, notFound } from '@tanstack/react-router'

import { PageHeading } from '@/components/sections/page-heading'
import { useMarket } from '@/components/layout/market-provider'

const policies = {
  'privacy-policy': {
    titleKey: 'footer.privacyPolicy',
    body: 'We collect only the information needed to provide orders, account access, support, and storefront updates. Customer data should be handled through Spree-backed server boundaries.',
  },
  'returns-policy': {
    titleKey: 'footer.returnPolicy',
    body: 'Returns are reviewed from the order record so totals, taxes, discounts, and inventory-sensitive state stay aligned with Spree.',
  },
  'shipping-policy': {
    titleKey: 'footer.shippingPolicy',
    body: 'Shipping options and final rates are confirmed during checkout from the current Spree order state.',
  },
  'terms-of-service': {
    titleKey: 'footer.termsOfService',
    body: 'By using this storefront, customers agree to complete purchases through the checkout flow and provide accurate order information.',
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
            {policy.body}
          </p>
        </div>
      </section>
    </>
  )
}
