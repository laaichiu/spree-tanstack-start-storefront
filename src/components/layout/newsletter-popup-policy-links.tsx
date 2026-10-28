import { Link } from '@tanstack/react-router'

import type { NewsletterPopupConsentLinks } from '@/components/newsletter/newsletter-popup-types'

type NewsletterPopupPolicyLinksOptions = {
  marketParams: { country: string; locale: string }
}

export function createNewsletterPopupPolicyLinks({
  marketParams,
}: NewsletterPopupPolicyLinksOptions): NewsletterPopupConsentLinks {
  return {
    privacy: ({ children, className }) => (
      <Link
        className={className}
        params={{ ...marketParams, slug: 'privacy-policy' }}
        preload={false}
        to="/$country/$locale/policies/$slug"
      >
        {children}
      </Link>
    ),
    terms: ({ children, className }) => (
      <Link
        className={className}
        params={{ ...marketParams, slug: 'terms-of-service' }}
        preload={false}
        to="/$country/$locale/policies/$slug"
      >
        {children}
      </Link>
    ),
  }
}

export type { NewsletterPopupPolicyLinksOptions }
