import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/components/ui/utils'
import type { CheckoutSummaryShellModel } from '../contracts/checkout'

export type { CheckoutSummaryShellModel } from '../contracts/checkout'

export function CheckoutSummaryShellView({
  content,
  model,
  onMobileToggle,
}: {
  content: ReactNode
  model: CheckoutSummaryShellModel
  onMobileToggle: () => void
}) {
  return (
    <aside className="border-b border-border bg-background text-foreground lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:self-start lg:border-b-0">
      <button
        aria-controls="checkout-mobile-summary"
        aria-expanded={model.isMobileOpen}
        className={cn(
          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-muted/40 px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden',
          { 'border-b border-border': model.isMobileOpen },
        )}
        onClick={onMobileToggle}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm leading-5 font-normal text-foreground">
          <span className="truncate">{model.label}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
              model.isMobileOpen && 'rotate-180',
            )}
          />
        </span>
        <span className="text-right text-xs leading-5 font-normal text-foreground">
          {model.total}
        </span>
      </button>

      <div
        className={cn(model.isMobileOpen ? 'block' : 'hidden', 'lg:block')}
        id="checkout-mobile-summary"
      >
        <div className="px-6 pt-6 pb-6 lg:mr-auto lg:max-w-checkout lg:px-14 lg:py-12">
          <div className="lg:max-w-checkout">{content}</div>
        </div>
      </div>
    </aside>
  )
}
