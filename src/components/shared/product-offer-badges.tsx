import { getDiscountPercent } from '@/lib/money/discount'
import type { MessageKey } from '@/lib/i18n/messages'
import type { Money } from '@/lib/money/money'
import { cn } from '@/lib/utils'

import { ProductSaleBadge } from './product-sale-badge'

type ProductOfferBadgesProps = {
  className?: string
  compareAtPrice?: Money | null
  discountPercent?: number | null
  isPreorder?: boolean
  price?: Money | null
  t: (key: MessageKey) => string
}

export function ProductOfferBadges({
  className,
  compareAtPrice,
  discountPercent: explicitDiscountPercent,
  isPreorder = false,
  price,
  t,
}: ProductOfferBadgesProps) {
  const discountPercent =
    explicitDiscountPercent ?? getDiscountPercent(price, compareAtPrice)

  if (!discountPercent && !isPreorder) {
    return null
  }

  const saleLabel = discountPercent
    ? t('product.discount').replace('{percent}', String(discountPercent))
    : null

  return (
    <span className={cn('flex items-center gap-1', className)}>
      {saleLabel ? <ProductSaleBadge label={saleLabel} /> : null}
      {isPreorder ? (
        <ProductSaleBadge label={t('product.preorder')} tone="neutral" />
      ) : null}
    </span>
  )
}
