import type { ReactNode } from 'react'

export function SearchCategoryLinkView({
  children,
  renderLink,
}: {
  children: ReactNode
  renderLink: (content: ReactNode, className?: string) => ReactNode
}) {
  return renderLink(
    children,
    'text-xs leading-4 font-normal uppercase inline-flex min-h-9 items-center border border-border px-3 text-foreground transition-colors motion-reduce:transition-none hover:not-focus-visible:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  )
}
