import type { ReactNode } from 'react'

import type {
  CartDrawerLineItemModel,
  CartLinkRenderer,
} from '@/components/contracts/cart'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import { CartDisplayOptionsView } from './cart-display-options-view'
import { MoneyDisplayView } from '@/components/shared/money-display-view'

export type { CartDrawerLineItemModel } from '@/components/contracts/cart'

type CartDrawerLineItemViewProps = {
  model: CartDrawerLineItemModel
  onRemoveItem: () => void | Promise<void>
  quantitySelector: ReactNode
  renderProductLink: CartLinkRenderer
}

export function CartDrawerLineItemView({
  model,
  onRemoveItem,
  quantitySelector,
  renderProductLink,
}: CartDrawerLineItemViewProps) {
  const { imageFallbackLabel, isPending, labels } = model

  return (
    <li className="px-4 sm:px-5 max-lg:landscape:px-3">
      <div className="flex items-stretch gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4 sm:py-6 max-lg:landscape:gap-2 max-lg:landscape:py-3">
        {renderProductLink(
          model.imageUrl ? (
            <img
              alt={model.name}
              className="h-full w-full object-cover"
              loading="lazy"
              src={model.imageUrl}
            />
          ) : (
            <ProductImageFallbackView label={imageFallbackLabel} />
          ),
          'block aspect-product w-20 shrink-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-32 max-lg:landscape:w-16',
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-x-2 sm:gap-x-4">
            <div className="min-w-0">
              {renderProductLink(
                model.name,
                'block text-xs leading-4 font-normal tracking-wider text-foreground uppercase transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:leading-5 max-lg:landscape:leading-4',
              )}
              <CartDisplayOptionsView
                className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-4 text-muted-foreground sm:mt-1 sm:gap-x-2.5 sm:gap-y-1 sm:leading-5 max-lg:landscape:mt-0.5 max-lg:landscape:gap-x-2 max-lg:landscape:gap-y-0.5 max-lg:landscape:leading-4"
                model={{ options: model.displayOptions }}
                optionClassName="inline-flex items-center gap-x-2 sm:gap-x-3 max-lg:landscape:gap-x-2"
              />
            </div>

            <div className="flex shrink-0 items-start text-right">
              <MoneyDisplayView
                {...model.totalPrice}
                className="text-xs leading-5 sm:leading-6 max-lg:landscape:leading-5"
                variant="detail"
              />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end gap-x-3 gap-y-2 pt-3 sm:gap-x-5 sm:gap-y-4 sm:pt-6 max-lg:landscape:gap-x-2 max-lg:landscape:gap-y-2 max-lg:landscape:pt-2">
            {quantitySelector}
            <button
              aria-label={labels.removeItem}
              className="pb-0.5 text-xs tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:pb-1"
              disabled={isPending}
              onClick={() => void onRemoveItem()}
              type="button"
            >
              {labels.remove}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
