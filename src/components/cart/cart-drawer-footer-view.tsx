import { ArrowRight, LockKeyhole, RotateCcw } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import type {
  CartDrawerFooterModel,
  CartLinkRenderer,
} from '@/components/contracts/cart'

type CartDrawerFooterViewProps = {
  model: CartDrawerFooterModel
  renderCheckoutLink: CartLinkRenderer
}

export function CartDrawerFooterView({
  model,
  renderCheckoutLink,
}: CartDrawerFooterViewProps) {
  const { labels } = model

  return (
    <div className="shrink-0 border-t border-border bg-background max-lg:landscape:min-h-0 max-lg:landscape:max-h-[50dvh] max-lg:landscape:overflow-y-auto max-lg:landscape:overscroll-contain">
      <div className="space-y-2 px-4 pt-3 pb-3 sm:px-5 sm:pt-5 sm:pb-5 max-lg:landscape:space-y-1.5 max-lg:landscape:px-3 max-lg:landscape:pt-2 max-lg:landscape:pb-2">
        <div className="flex items-center justify-between gap-4 text-xs leading-5 text-muted-foreground sm:leading-6 max-lg:landscape:gap-2 max-lg:landscape:leading-4">
          <span>{labels.subtotal}</span>
          {model.itemTotal}
        </div>
        <div className="flex items-center justify-between gap-4 text-xs leading-5 text-muted-foreground sm:leading-6 max-lg:landscape:gap-2 max-lg:landscape:leading-4">
          <span>{labels.shipping}</span>
          <span className="text-foreground">{model.shipping}</span>
        </div>
        <div className="border-t border-border pt-3 sm:pt-5 max-lg:landscape:pt-2">
          <div className="flex items-center justify-between gap-4 text-xs leading-6 font-normal text-foreground max-lg:landscape:gap-2 max-lg:landscape:leading-5">
            <span>{labels.total}</span>
            {model.total}
          </div>
        </div>
        {renderCheckoutLink(
          <>
            <span>{labels.checkout}</span>
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </>,
          buttonClassName({
            className:
              'mt-3 h-11 min-h-11 w-full border-foreground bg-foreground px-4 text-background hover:bg-foreground/90 sm:mt-5 sm:h-14 sm:min-h-14 sm:px-5 max-lg:landscape:mt-2 max-lg:landscape:h-11 max-lg:landscape:min-h-11 max-lg:landscape:px-3',
            size: 'lg',
          }),
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-xs leading-4 text-muted-foreground sm:gap-2 sm:px-5 sm:pt-5 sm:pb-5 sm:leading-6 max-lg:landscape:gap-x-3 max-lg:landscape:gap-y-1 max-lg:landscape:px-3 max-lg:landscape:pt-2 max-lg:landscape:pb-2 max-lg:landscape:leading-4">
        <span className="inline-flex items-center gap-1.5 sm:gap-2">
          <LockKeyhole
            aria-hidden="true"
            className="h-3.5 w-3.5 stroke-[1.5] sm:h-4 sm:w-4"
          />
          {labels.secureCheckout}
        </span>
        <span className="inline-flex items-center gap-1.5 sm:gap-2">
          <RotateCcw
            aria-hidden="true"
            className="h-3.5 w-3.5 stroke-[1.5] sm:h-4 sm:w-4"
          />
          {labels.returnsWindow}
        </span>
      </div>
    </div>
  )
}
