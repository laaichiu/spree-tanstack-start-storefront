import { useMarket } from '@/components/layout/market-provider'
import { createNewsletterVerificationLinks } from '@/components/newsletter/newsletter-verification-links'
import type { NewsletterVerificationStatus } from '@/lib/newsletter/contracts'
import { NewsletterVerificationContent } from '@/components/newsletter/newsletter-verification-content'

export function NewsletterVerificationPage({
  status,
}: {
  status: NewsletterVerificationStatus
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <NewsletterVerificationContent
      links={createNewsletterVerificationLinks({
        marketParams,
      })}
      model={{
        copy: {
          continueShopping: t('newsletterVerification.continueShopping'),
          invalidDescription: t('newsletterVerification.invalidDescription'),
          invalidTitle: t('newsletterVerification.invalidTitle'),
          signIn: t('newsletterVerification.signIn'),
          signInHint: t('newsletterVerification.signInHint'),
          successDescription: t('newsletterVerification.successDescription'),
          successTitle: t('newsletterVerification.successTitle'),
          unavailableDescription: t(
            'newsletterVerification.unavailableDescription',
          ),
          unavailableTitle: t('newsletterVerification.unavailableTitle'),
          unsupportedDescription: t(
            'newsletterVerification.unsupportedDescription',
          ),
          unsupportedTitle: t('newsletterVerification.unsupportedTitle'),
        },
        status,
      }}
    />
  )
}
