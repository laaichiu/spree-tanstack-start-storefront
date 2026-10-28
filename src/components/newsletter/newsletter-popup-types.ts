import type { ReactNode } from 'react'

export type NewsletterPopupModel = {
  body: string
  closeLabel: string
  dismissLabel: string
  open: boolean
  successBody: string
  successDismissLabel: string
  successTitle: string
  submitted: boolean
  title: string
}

export type NewsletterPopupActions = {
  dismiss: () => void
  openChange: (open: boolean) => void
}

export type NewsletterPopupSlots = {
  consent: ReactNode
  form: ReactNode
}

export type NewsletterPopupConsentLink = (input: {
  children: ReactNode
  className: string
}) => ReactNode

export type NewsletterPopupConsentLinks = {
  privacy: NewsletterPopupConsentLink
  terms: NewsletterPopupConsentLink
}

export type NewsletterPopupConsentModel = {
  andLabel: string
  privacyLabel: string
  prefix: string
  termsLabel: string
}

export type NewsletterPopupProps = {
  actions: NewsletterPopupActions
  model: NewsletterPopupModel
  slots: NewsletterPopupSlots
}
