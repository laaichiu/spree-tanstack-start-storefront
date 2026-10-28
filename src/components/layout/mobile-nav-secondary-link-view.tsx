import type { ReactNode } from 'react'
import type { LayoutActionRenderer } from '../contracts/layout'

export function MobileNavSecondaryLinkView({
  children,
  renderLink,
}: {
  children: ReactNode
  renderLink: LayoutActionRenderer
}) {
  return renderLink(
    children,
    'text-xs leading-4 font-normal uppercase flex min-h-11 items-center justify-between py-1 text-left text-foreground transition-opacity hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  )
}
