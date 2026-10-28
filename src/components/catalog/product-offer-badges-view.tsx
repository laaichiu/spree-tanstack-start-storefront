import { cn } from '@/components/ui/utils'

import { ProductOfferBadgeView } from './product-offer-badge-view'

export function ProductOfferBadgesView({
  className,
  preorderLabel,
  saleLabel,
}: {
  className?: string
  preorderLabel: string | null
  saleLabel: string | null
}) {
  if (!saleLabel && !preorderLabel) {
    return null
  }

  return (
    <span className={cn('flex items-center gap-1', className)}>
      {saleLabel && <ProductOfferBadgeView label={saleLabel} />}
      {preorderLabel && (
        <ProductOfferBadgeView label={preorderLabel} tone="neutral" />
      )}
    </span>
  )
}
