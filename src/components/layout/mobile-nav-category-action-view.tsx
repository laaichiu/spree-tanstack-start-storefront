import { cn } from '@/components/ui/utils'
import type { ReactNode } from 'react'
import type { LayoutActionRenderer } from '../contracts/layout'

export function MobileNavCategoryActionView({
  children,
  hasChevron,
  renderAction,
  tone = 'default',
}: {
  children: ReactNode
  hasChevron: boolean
  renderAction: LayoutActionRenderer
  tone?: 'default' | 'sale'
}) {
  return renderAction(
    <>
      <span>{children}</span>
      <span className="flex h-6 w-6 items-center justify-end justify-self-end text-foreground">
        {hasChevron && <MenuChevronIcon />}
      </span>
    </>,
    cn(
      'text-xs uppercase leading-tight grid min-h-13 w-full grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-4 py-1 text-left text-foreground transition-opacity hover:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      tone === 'sale' && 'text-destructive',
    ),
  )
}

function MenuChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-2.5"
      fill="none"
      viewBox="0 0 10 18"
    >
      <path
        d="M2 2.25 8 9l-6 6.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}
