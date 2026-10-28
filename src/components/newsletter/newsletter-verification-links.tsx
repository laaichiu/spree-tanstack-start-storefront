import { Link } from '@tanstack/react-router'

import type { NewsletterVerificationLinks } from './newsletter-verification-types'

type NewsletterVerificationLinksOptions = {
  marketParams: { country: string; locale: string }
}

export function createNewsletterVerificationLinks({
  marketParams,
}: NewsletterVerificationLinksOptions): NewsletterVerificationLinks {
  return {
    continueShopping: ({ children, className }) => (
      <Link className={className} params={marketParams} to="/$country/$locale">
        {children}
      </Link>
    ),
    signIn: ({ children, className }) => (
      <Link
        className={className}
        params={marketParams}
        search={{ redirect: undefined }}
        to="/$country/$locale/account/login"
      >
        {children}
      </Link>
    ),
  }
}

export type { NewsletterVerificationLinksOptions }
