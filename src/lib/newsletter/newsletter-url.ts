import { buildNewsletterVerificationRedirectUrl } from '@/lib/newsletter/utils/newsletter-url'
import type { NewsletterVerificationRedirectUrlInput } from '@/lib/newsletter/utils/newsletter-url'

export function getBrowserNewsletterVerificationRedirectUrl({
  country,
  locale,
}: Pick<NewsletterVerificationRedirectUrlInput, 'country' | 'locale'>) {
  if (typeof window === 'undefined') {
    return undefined
  }

  return buildNewsletterVerificationRedirectUrl({
    country,
    locale,
    origin: window.location.origin,
  })
}
