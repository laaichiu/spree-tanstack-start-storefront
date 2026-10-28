import { cn } from '@/components/ui/utils'

import type { MoneyDisplay } from './money-display'

export type MoneyDisplayViewProps = MoneyDisplay & {
  className?: string
  variant?: 'default' | 'detail' | 'listing'
}

export function MoneyDisplayView({
  compareAtPriceLabel,
  className,
  priceLabel,
  variant = 'default',
}: MoneyDisplayViewProps) {
  const isListing = variant === 'listing'
  const isDetail = variant === 'detail'

  return (
    <span
      className={cn(
        'flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 text-foreground',
        isListing && 'text-sm leading-5 font-normal',
        isDetail && 'text-sm leading-6 font-normal tracking-wider',
        !isListing && !isDetail && 'text-sm leading-5',
        className,
      )}
    >
      <span className="font-normal">{priceLabel}</span>
      {compareAtPriceLabel && (
        <span
          className={cn(
            'text-muted-foreground line-through',
            isListing && 'text-xs',
            isDetail && 'text-xs leading-none',
          )}
        >
          {compareAtPriceLabel}
        </span>
      )}
    </span>
  )
}
