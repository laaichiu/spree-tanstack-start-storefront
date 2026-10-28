import { Truck } from 'lucide-react'

import {
  SheetCloseButton,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { CartDrawerHeaderModel } from '@/components/contracts/cart'

type CartDrawerHeaderViewProps = {
  model: CartDrawerHeaderModel
  onClose: () => void
}

export function CartDrawerHeaderView({
  model,
  onClose,
}: CartDrawerHeaderViewProps) {
  const { freeShipping, labels } = model

  return (
    <SheetHeader className="relative block border-b-0 p-0">
      <div className="flex min-h-16 items-center gap-3 border-b border-border px-4 sm:min-h-20 sm:gap-3.5 sm:px-5 max-lg:landscape:min-h-12 max-lg:landscape:gap-2 max-lg:landscape:px-3">
        <SheetTitle className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
          <span className="text-base leading-none font-normal tracking-wider text-foreground sm:text-xl max-lg:landscape:text-base">
            {labels.yourBag}
          </span>
          <span className="text-base leading-none font-light text-muted-foreground sm:text-xl max-lg:landscape:text-base">
            ({model.itemCountLabel})
          </span>
        </SheetTitle>
        <SheetCloseButton
          aria-label={labels.closeCart}
          className="ml-auto"
          onClick={onClose}
        />
      </div>

      {freeShipping && (
        <div className="px-4 pt-3 sm:px-5 sm:pt-5 max-lg:landscape:px-3 max-lg:landscape:pt-2">
          <p className="flex items-center gap-2 pr-8 text-xs leading-5 text-foreground sm:gap-2.5 sm:pr-10 sm:leading-6 max-lg:landscape:gap-1.5 max-lg:landscape:pr-6 max-lg:landscape:leading-4">
            <Truck
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 stroke-[1.5] sm:h-4 sm:w-4 max-lg:landscape:h-3 max-lg:landscape:w-3"
            />
            <span>{freeShipping.message}</span>
          </p>
          <div
            aria-label={freeShipping.message}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={freeShipping.progressPercent}
            className="mt-3 h-0.5 w-full overflow-hidden bg-muted sm:mt-4 sm:h-0.75 max-lg:landscape:mt-2 max-lg:landscape:h-0.5"
            role="progressbar"
          >
            <div
              className="h-full bg-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{
                width: `${freeShipping.progressPercent}%`,
              }}
            />
          </div>
          <div className="mt-3 border-b border-border sm:mt-5 max-lg:landscape:mt-2" />
        </div>
      )}
    </SheetHeader>
  )
}
