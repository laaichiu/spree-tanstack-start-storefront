import { NewsletterPopupConsent } from '@/components/newsletter/newsletter-popup-consent'
import { NewsletterPopup as NewsletterPopupView } from '@/components/newsletter/newsletter-popup'
import { NewsletterPopupForm } from '@/components/newsletter/newsletter-popup-form'

import { useNewsletterPopupController } from './use-newsletter-popup-controller'

export function NewsletterPopup({
  onAccepted,
  onDismiss,
}: {
  onAccepted: () => void
  onDismiss: () => void
}) {
  const { actions, consent, form, model } = useNewsletterPopupController({
    onAccepted,
    onDismiss,
  })

  return (
    <NewsletterPopupView
      actions={actions}
      slots={{
        consent: (
          <NewsletterPopupConsent links={consent.links} model={consent.model} />
        ),
        form: (
          <NewsletterPopupForm
            emailInputProps={form.emailInputProps}
            model={form.model}
            onSubmit={form.onSubmit}
          />
        ),
      }}
      model={model}
    />
  )
}
