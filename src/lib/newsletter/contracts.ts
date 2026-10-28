/**
 * Framework-independent newsletter verification page state.
 *
 * Verification tokens, API calls, redirects, and subscription mutations stay
 * in the storefront runtime.
 */
export type NewsletterVerificationStatus =
  'invalid' | 'unavailable' | 'unsupported' | 'verified'

export type NewsletterVerificationPageState = {
  status: NewsletterVerificationStatus
}
