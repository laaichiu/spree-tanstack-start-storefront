import type { ReactNode } from 'react'

import type { NewsletterVerificationStatus } from '@/lib/newsletter/contracts'

export type NewsletterVerificationCopy = {
  continueShopping: string
  invalidDescription: string
  invalidTitle: string
  signIn: string
  signInHint: string
  successDescription: string
  successTitle: string
  unavailableDescription: string
  unavailableTitle: string
  unsupportedDescription: string
  unsupportedTitle: string
}

export type NewsletterVerificationLink = (input: {
  className: string
  children: ReactNode
}) => ReactNode

export type NewsletterVerificationLinks = {
  continueShopping: NewsletterVerificationLink
  signIn: NewsletterVerificationLink
}

export type NewsletterVerificationPageModel = {
  copy: NewsletterVerificationCopy
  status: NewsletterVerificationStatus
}

export type NewsletterVerificationPageProps = {
  links: NewsletterVerificationLinks
  model: NewsletterVerificationPageModel
}
