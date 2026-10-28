import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { CheckoutConsentNoticeView } from '@/components/checkout/checkout-consent-notice-view'

export function CheckoutConsentNotice() {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <CheckoutConsentNoticeView
      capabilities={{
        renderPrivacyLink: (content, className) => (
          <Link
            className={className}
            params={{ ...marketParams, slug: 'privacy-policy' }}
            to="/$country/$locale/policies/$slug"
          >
            {content}
          </Link>
        ),
        renderTermsLink: (content, className) => (
          <Link
            className={className}
            params={{ ...marketParams, slug: 'terms-of-service' }}
            to="/$country/$locale/policies/$slug"
          >
            {content}
          </Link>
        ),
      }}
      model={{
        afterPrivacy: t('checkout.consentAfterPrivacy'),
        beforeTerms: t('checkout.consentBeforeTerms'),
        betweenPolicies: t('checkout.consentBetweenPolicies'),
        privacyLabel: t('footer.privacyPolicy'),
        termsLabel: t('footer.termsOfService'),
      }}
    />
  )
}
