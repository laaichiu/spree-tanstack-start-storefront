import type { ReactNode } from 'react'

export type LayoutLinkRenderer = (
  content: ReactNode,
  className?: string,
) => ReactNode

export type LayoutActionRenderer = (
  content: ReactNode,
  className: string,
) => ReactNode
