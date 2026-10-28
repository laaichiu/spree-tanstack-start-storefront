import type { LayoutLinkRenderer } from '../layout/primitives'

export type CheckoutConsentNoticeCapabilities = {
  renderPrivacyLink: LayoutLinkRenderer
  renderTermsLink: LayoutLinkRenderer
}

export type CheckoutConsentNoticeModel = {
  afterPrivacy: string
  beforeTerms: string
  betweenPolicies: string
  privacyLabel: string
  termsLabel: string
}

export type CheckoutSignInLinkCapabilities = {
  renderLink: LayoutLinkRenderer
}

export type CheckoutSignInLinkModel = {
  label: string
}
