import type { ReactNode } from 'react'

export type CheckoutLayoutShellBranding = {
  logoUrl: string | null
  name: string
}

export type CheckoutLayoutShellLegalLink = {
  id: string
  label: string
}

export type CheckoutLayoutShellCapabilities = {
  renderHomeLink: (content: ReactNode, className: string) => ReactNode
  renderLegalLink: (
    link: CheckoutLayoutShellLegalLink,
    props: { children: ReactNode; className: string },
  ) => ReactNode
}

export type CheckoutLayoutShellModel = {
  branding: CheckoutLayoutShellBranding
  legalLinks: readonly CheckoutLayoutShellLegalLink[]
}

export type CheckoutLayoutShellProps = {
  capabilities: CheckoutLayoutShellCapabilities
  content: ReactNode
  model: CheckoutLayoutShellModel
}

export type CheckoutPageSlots = {
  delivery: ReactNode
  express: ReactNode
  payment: ReactNode
  submit: ReactNode
  summary: ReactNode
}

export type CheckoutPageProps = {
  error: string | null
  slots: CheckoutPageSlots
}
