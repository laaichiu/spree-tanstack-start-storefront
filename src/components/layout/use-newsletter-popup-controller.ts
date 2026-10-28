import { useEffect, useState } from 'react'

import { useNewsletterSubscriptionForm } from '@/lib/newsletter/client/use-newsletter-subscription-form'

import { useMarket } from './market-provider'
import { createNewsletterPopupPolicyLinks } from './newsletter-popup-policy-links'

export function useNewsletterPopupController({
  onAccepted,
  onDismiss,
}: {
  onAccepted: () => void
  onDismiss: () => void
}) {
  const { market, t } = useMarket()
  const [open, setOpen] = useState(true)
  const {
    errors,
    isSubmitting,
    requestError,
    clearRequestError,
    register,
    status,
    submit,
  } = useNewsletterSubscriptionForm({
    market,
    messages: {
      requestFailed: t('newsletterPopup.requestFailed'),
      unsupported: t('newsletterPopup.unsupported'),
    },
  })
  const submitted = status === 'accepted'

  useEffect(() => {
    if (submitted) {
      onAccepted()
    }
  }, [onAccepted, submitted])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      onDismiss()
    }

    setOpen(nextOpen)
  }

  function dismissPopup() {
    setOpen(false)
    onDismiss()
  }

  return {
    actions: {
      dismiss: dismissPopup,
      openChange: handleOpenChange,
    },
    consent: {
      links: createNewsletterPopupPolicyLinks({
        marketParams: { country: market.country, locale: market.locale },
      }),
      model: {
        andLabel: t('newsletterPopup.consentAnd'),
        privacyLabel: t('footer.privacyPolicy'),
        prefix: t('newsletterPopup.consentPrefix'),
        termsLabel: t('footer.termsOfService'),
      },
    },
    form: {
      emailInputProps: register({ onChange: clearRequestError }),
      model: {
        emailLabel: t('footer.emailAddress'),
        emailPlaceholder: t('newsletterPopup.emailPlaceholder'),
        errorMessage: errors.email?.message
          ? t('newsletterPopup.invalidEmail')
          : requestError,
        isSubmitting,
        submitLabel: t('newsletterPopup.submit'),
        submittingLabel: t('newsletterPopup.submitting'),
      },
      onSubmit: submit,
    },
    model: {
      body: t('newsletterPopup.body'),
      closeLabel: t('newsletterPopup.closeButton'),
      dismissLabel: t('newsletterPopup.dismiss'),
      open,
      successBody: t('newsletterPopup.successBody'),
      successDismissLabel: t('newsletterPopup.successDismiss'),
      successTitle: t('newsletterPopup.successTitle'),
      submitted,
      title: t('newsletterPopup.title'),
    },
  }
}
