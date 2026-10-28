import type {
  NewsletterPopupConsentLinks,
  NewsletterPopupConsentModel,
} from './newsletter-popup-types'

export type {
  NewsletterPopupConsentLink,
  NewsletterPopupConsentLinks,
  NewsletterPopupConsentModel,
} from './newsletter-popup-types'

export function NewsletterPopupConsent({
  links,
  model,
}: {
  links: NewsletterPopupConsentLinks
  model: NewsletterPopupConsentModel
}) {
  return (
    <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">
      {model.prefix}{' '}
      {links.privacy({
        children: model.privacyLabel,
        className: 'underline decoration-border underline-offset-4',
      })}{' '}
      {model.andLabel}{' '}
      {links.terms({
        children: model.termsLabel,
        className: 'underline decoration-border underline-offset-4',
      })}
      .
    </p>
  )
}
