import type { ReactNode } from 'react'

export type StorefrontShellProps = {
  children: ReactNode
  slots: StorefrontShellSlots
}

export type StorefrontShellSlots = {
  footer: ReactNode
  header: ReactNode
  newsletterPopup?: ReactNode
}

export type NotFoundPageModel = {
  description: string
  eyebrow: string
  primaryLabel: string
  secondaryLabel?: string
  title: string
}
