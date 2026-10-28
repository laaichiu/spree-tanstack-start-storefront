import type {
  CheckoutConsentNoticeCapabilities,
  CheckoutConsentNoticeModel,
} from '../contracts/checkout'

export type {
  CheckoutConsentNoticeCapabilities,
  CheckoutConsentNoticeModel,
} from '../contracts/checkout'

export function CheckoutConsentNoticeView({
  capabilities,
  model,
}: {
  capabilities: CheckoutConsentNoticeCapabilities
  model: CheckoutConsentNoticeModel
}) {
  return (
    <section className="pt-4">
      <p className="text-xs leading-7 text-muted-foreground">
        {model.beforeTerms}{' '}
        {capabilities.renderTermsLink(
          model.termsLabel,
          'text-foreground underline underline-offset-2 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}{' '}
        {model.betweenPolicies}{' '}
        {capabilities.renderPrivacyLink(
          model.privacyLabel,
          'text-foreground underline underline-offset-2 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}
        {model.afterPrivacy}
      </p>
    </section>
  )
}
