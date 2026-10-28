import { useMarket } from '@/components/layout/market-provider'
import { useNewsletterSubscriptionForm } from '@/lib/newsletter/client/use-newsletter-subscription-form'
import { NewsletterSignupForm } from '@/components/newsletter/newsletter-signup-form'
import type { NewsletterSignupFormFeedback } from './newsletter-form-types'

export function NewsletterSignup() {
  const { market, t } = useMarket()
  const {
    errors,
    isSubmitting,
    message,
    register,
    requestError,
    clearRequestError,
    submit,
  } = useNewsletterSubscriptionForm({
    market,
    messages: {
      requestFailed: t('footer.newsletterFailed'),
      unsupported: t('footer.newsletterUnsupported'),
    },
  })

  const feedback = getNewsletterSignupFeedback({
    emailError: errors.email?.message,
    hint: t('footer.newsletterHint'),
    message,
    requestError,
  })

  return (
    <NewsletterSignupForm
      emailInputProps={register({ onChange: clearRequestError })}
      model={{
        emailLabel: t('footer.emailAddress'),
        emailPlaceholder: t('footer.emailAddress'),
        feedback,
        isSubmitting,
        submitLabel: t('footer.newsletterSubmit'),
      }}
      onSubmit={submit}
    />
  )
}

function getNewsletterSignupFeedback({
  emailError,
  hint,
  message,
  requestError,
}: {
  emailError?: string
  hint: string
  message: string | null
  requestError: string | null
}): NewsletterSignupFormFeedback {
  if (emailError) {
    return { text: emailError, tone: 'error' }
  }

  if (message) {
    return { text: message, tone: 'success' }
  }

  if (requestError) {
    return { text: requestError, tone: 'error' }
  }

  return { text: hint, tone: 'hint' }
}
