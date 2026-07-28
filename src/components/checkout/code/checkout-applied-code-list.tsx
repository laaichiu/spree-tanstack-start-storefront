import { useMarket } from '@/components/layout/market-provider'
import type {
  CartAppliedDiscount,
  CartAppliedGiftCard,
} from '@/lib/cart/model/cart'

import { CheckoutAppliedCodeItem } from './checkout-applied-code-item'

export function CheckoutAppliedCodeList({
  appliedGiftCard,
  removableDiscounts,
  onRemoveDiscount,
  onRemoveGiftCard,
  removingCodeKey,
}: {
  appliedGiftCard: CartAppliedGiftCard | null
  removableDiscounts: CartAppliedDiscount[]
  onRemoveDiscount: (discount: CartAppliedDiscount) => void
  onRemoveGiftCard: (giftCard: CartAppliedGiftCard) => void
  removingCodeKey: string | null
}) {
  const { t } = useMarket()

  if (!removableDiscounts.length && !appliedGiftCard) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {removableDiscounts.map((discount) => (
        <CheckoutAppliedCodeItem
          amount={discount.amount}
          key={discount.id}
          label={discount.code || discount.name}
          onRemove={() => onRemoveDiscount(discount)}
          removeLabel={t('checkout.removeDiscountCode')}
          removing={removingCodeKey === `discount:${discount.code}`}
        />
      ))}
      {appliedGiftCard ? (
        <CheckoutAppliedCodeItem
          amount={appliedGiftCard.appliedAmount}
          label={appliedGiftCard.code}
          onRemove={() => onRemoveGiftCard(appliedGiftCard)}
          removeLabel={t('checkout.removeGiftCard')}
          removing={removingCodeKey === `gift_card:${appliedGiftCard.id}`}
        />
      ) : null}
    </div>
  )
}
