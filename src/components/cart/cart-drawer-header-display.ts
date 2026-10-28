import type { CartFreeShippingProgress } from '@/lib/cart/contracts'
import type { CartDrawerHeaderDisplay } from '@/components/contracts/cart/drawer'
import { formatMoney } from '@/components/shared/money-display'
import { getCartItemCountLabel } from './cart-item-count-display'

type CartDrawerHeaderDisplayLabels = {
  freeShippingReceived: string
  freeShippingSpendMore: string
  itemPlural: string
  itemSingular: string
}

export function getCartDrawerHeaderDisplay({
  freeShippingProgress,
  itemCount,
  labels,
  locale,
}: {
  freeShippingProgress: CartFreeShippingProgress | null
  itemCount: number
  labels: CartDrawerHeaderDisplayLabels
  locale: string
}): CartDrawerHeaderDisplay {
  const freeShipping = getFreeShippingDisplay({
    freeShippingProgress,
    labels,
    locale,
  })

  return {
    ...(freeShipping ? { freeShipping } : {}),
    itemCountLabel: getCartItemCountLabel({
      itemCount,
      itemPlural: labels.itemPlural,
      itemSingular: labels.itemSingular,
    }),
  }
}

function getFreeShippingDisplay({
  freeShippingProgress,
  labels,
  locale,
}: {
  freeShippingProgress: CartFreeShippingProgress | null
  labels: Pick<
    CartDrawerHeaderDisplayLabels,
    'freeShippingReceived' | 'freeShippingSpendMore'
  >
  locale: string
}): CartDrawerHeaderDisplay['freeShipping'] {
  if (freeShippingProgress === null) {
    return undefined
  }

  return {
    message: freeShippingProgress.isThresholdReached
      ? labels.freeShippingReceived
      : labels.freeShippingSpendMore.replace(
          '{amount}',
          formatMoney(freeShippingProgress.remaining, locale),
        ),
    progressPercent: freeShippingProgress.progressPercent,
  }
}
