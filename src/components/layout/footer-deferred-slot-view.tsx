import { cn } from '@/components/ui/utils'

import type { FooterDeferredSlotProps } from '../contracts/layout'

export type {
  FooterDeferredSlotModel,
  FooterDeferredSlotProps,
  FooterDeferredSlotSlots,
} from '../contracts/layout'

export function FooterDeferredSlotView({
  model,
  onRetry,
  slotRef,
  slots,
}: FooterDeferredSlotProps) {
  return (
    <div className="min-h-5" ref={slotRef}>
      {model.hasLoadError ? (
        <div
          aria-live="polite"
          className="flex min-h-5 items-center"
          role="alert"
        >
          <button
            className="text-xs font-normal text-muted-foreground underline underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={onRetry}
            type="button"
          >
            {model.retryLabel}
          </button>
        </div>
      ) : (
        slots.content || slots.fallback
      )}
    </div>
  )
}

export function FooterMarketSelectorFallbackView() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-5 w-24 animate-pulse bg-muted motion-reduce:animate-none',
        'min-h-5',
      )}
    />
  )
}

export function FooterNewsletterSignupFallbackView() {
  return (
    <div
      aria-hidden="true"
      className="mt-6 h-14 w-full animate-pulse border border-input bg-muted motion-reduce:animate-none"
    />
  )
}
