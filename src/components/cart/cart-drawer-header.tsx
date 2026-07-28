import { Truck } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import {
  SheetCloseButton,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { CartSummary } from '@/lib/cart/model/cart'
import type { CartFreeShippingProgress } from '@/lib/cart/utils/free-shipping'

type CartDrawerHeaderProps = {
  activeCart: CartSummary | null
  freeShippingProgress: CartFreeShippingProgress | null
  itemCountLabel: string
  onClose: () => void
  shippingHeaderMessage: string | null
}

export function CartDrawerHeader({
  activeCart,
  freeShippingProgress,
  itemCountLabel,
  onClose,
  shippingHeaderMessage,
}: CartDrawerHeaderProps) {
  const { t } = useMarket()

  return (
    <SheetHeader className="relative block border-b-0 p-0">
      <div className="flex min-h-20 items-center gap-3.5 border-b border-border px-5 pr-16">
        <SheetTitle className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xl leading-none font-normal tracking-wider text-foreground">
            {t('cart.yourBag')}
          </span>
          <span className="text-xl leading-none font-light text-muted-foreground">
            ({itemCountLabel})
          </span>
        </SheetTitle>
      </div>

      <SheetCloseButton
        aria-label={t('cart.closeCart')}
        className="absolute top-6 right-5"
        onClick={onClose}
      />

      {activeCart && freeShippingProgress && shippingHeaderMessage ? (
        <div className="px-5 pt-5">
          <p className="text-lg leading-6 flex items-center gap-2.5 pr-10 text-foreground">
            <Truck
              aria-hidden="true"
              className="h-4 w-4 shrink-0 stroke-[1.5]"
            />
            <span>{shippingHeaderMessage}</span>
          </p>
          <div
            aria-label={shippingHeaderMessage}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={freeShippingProgress.progressPercent}
            className="mt-4 h-0.75 w-full overflow-hidden bg-muted"
            role="progressbar"
          >
            <div
              className="h-full bg-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${freeShippingProgress.progressPercent}%` }}
            />
          </div>
          <div className="mt-5 border-b border-border" />
        </div>
      ) : null}
    </SheetHeader>
  )
}
