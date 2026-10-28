import type { ReactNode } from 'react'

export type CartLinkRenderer = (
  content: ReactNode,
  className?: string,
) => ReactNode

export type CartPolicyLinkRenderer = (
  slug: 'returns-policy' | 'shipping-policy',
  content: ReactNode,
  className?: string,
) => ReactNode
