import type { ReactNode } from 'react'

import type { LayoutActionRenderer } from './primitives'

export type FooterItem =
  | { id: string; kind: 'link'; label: string }
  | { id: string; kind: 'text'; label: string }

export type FooterLinkItem = Extract<FooterItem, { kind: 'link' }>

export type FooterLinkRenderer = (
  item: FooterLinkItem,
  props: { children: ReactNode; className: string },
) => ReactNode

export type FooterLinkCapabilities = {
  renderLink: LayoutActionRenderer
}

export type FooterColumn = {
  id: string
  links: readonly FooterItem[]
  title: string
}

type FooterNewsletterModel = {
  consent: string
  title: string
}

export type FooterModel = {
  columns: readonly FooterColumn[]
  legalLinks: readonly FooterItem[]
  newsletter: FooterNewsletterModel
}

export type FooterCapabilities = {
  renderLink: FooterLinkRenderer
}

export type FooterSlots = {
  copyright: ReactNode
  marketSelector: ReactNode
  newsletter: ReactNode
}

export type FooterProps = {
  capabilities: FooterCapabilities
  model: FooterModel
  slots: FooterSlots
}
