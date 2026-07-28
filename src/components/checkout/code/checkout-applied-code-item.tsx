import { Tag, X } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'
import { formatMoney } from '@/lib/money/format-money'
import type { Money } from '@/lib/money/money'

export function CheckoutAppliedCodeItem({
  amount,
  label,
  onRemove,
  removeLabel,
  removing,
}: {
  amount: Money
  label: string
  onRemove?: () => void
  removeLabel?: string
  removing?: boolean
}) {
  const { market } = useMarket()

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background py-1.5 pr-1.5 pl-3">
      <div className="flex min-w-0 items-center gap-2 text-sm leading-5">
        <Tag aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate font-normal text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">
          {formatMoney(amount, market.locale)}
        </span>
      </div>
      {onRemove && removeLabel ? (
        <button
          aria-label={removeLabel}
          className={buttonClassName({
            className: 'h-6 w-6 shrink-0 rounded-full p-0',
            size: 'sm',
            variant: 'ghost',
          })}
          disabled={removing}
          onClick={onRemove}
          type="button"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
