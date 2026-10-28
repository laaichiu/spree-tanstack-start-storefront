import type { ComponentProps } from 'react'

export type NewsletterEmailInputProps = Omit<
  ComponentProps<'input'>,
  'autoComplete' | 'className' | 'disabled' | 'id' | 'placeholder' | 'type'
>

export type NewsletterSignupFormFeedback = {
  text: string
  tone: 'error' | 'hint' | 'success'
}

export type NewsletterSignupFormModel = {
  emailLabel: string
  emailPlaceholder: string
  feedback: NewsletterSignupFormFeedback
  isSubmitting: boolean
  submitLabel: string
}

export type NewsletterPopupFormModel = {
  emailLabel: string
  emailPlaceholder: string
  errorMessage: string | null
  isSubmitting: boolean
  submitLabel: string
  submittingLabel: string
}
