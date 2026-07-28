import { formatMoney } from '@/lib/money/format-money'
import type { Money } from '@/lib/money/money'
import { useMarket } from '@/components/layout/market-provider'
import { cn } from '@/lib/utils'

type ProductPriceProps = {
  price: Money
  compareAtPrice?: Money
  variant?: 'default' | 'detail' | 'listing'
}

export function ProductPrice({
  compareAtPrice,
  price,
  variant = 'default',
}: ProductPriceProps) {
  const { market } = useMarket()
  const isListing = variant === 'listing'
  const isDetail = variant === 'detail'

  return (
    <p
      className={cn(
        'flex items-baseline gap-2 text-foreground',
        isListing ? 'text-sm leading-5 font-normal' : null,
        isDetail ? 'text-lg leading-6 font-normal tracking-wider' : null,
        !isListing && !isDetail ? 'text-sm leading-5' : null,
      )}
    >
      <span className="font-normal">{formatMoney(price, market.locale)}</span>
      {compareAtPrice ? (
        <span
          className={cn(
            'text-muted-foreground line-through',
            isListing ? 'text-sm' : null,
            isDetail ? 'text-sm leading-none' : null,
          )}
        >
          {formatMoney(compareAtPrice, market.locale)}
        </span>
      ) : null}
    </p>
  )
}
