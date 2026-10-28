import { createFileRoute } from '@tanstack/react-router'

import { NewsletterVerificationPage } from '@/components/newsletter/newsletter-verification-page'
import { parseOptionalTrimmedSearchText } from '@/lib/core/optional-search-text'
import { translateMessage } from '@/lib/i18n/messages'
import { verifyNewsletterSubscription } from '@/lib/newsletter/api/subscribe-to-newsletter'
import type { NewsletterVerificationPageState } from '@/lib/newsletter/contracts'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/newsletter/verify')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: parseOptionalTrimmedSearchText(search.token),
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

      return {
        status: result.status,
      }
    } catch {
      return {
        status: 'unavailable',
      }
    }
  },
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'newsletterVerification.title'),
    }),
  component: NewsletterVerificationRoute,
})

function NewsletterVerificationRoute() {
  const { status } = Route.useLoaderData()
  return <NewsletterVerificationPage status={status} />
}
