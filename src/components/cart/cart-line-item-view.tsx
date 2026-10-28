import type { ReactNode } from 'react'

import type {
  CartLinkRenderer,
  CartLineItemModel,
} from '@/components/contracts/cart'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import { CartDisplayOptionsView } from './cart-display-options-view'
import { MoneyDisplayView } from '@/components/shared/money-display-view'

export type { CartLineItemModel } from '@/components/contracts/cart'

type CartLineItemViewProps = {
  model: CartLineItemModel
  onRemoveItem: () => void | Promise<void>
  quantitySelector: ReactNode
  renderProductLink: CartLinkRenderer
}

export function CartLineItemView({
  model,
  onRemoveItem,
  quantitySelector,
  renderProductLink,
}: CartLineItemViewProps) {
  const { imageFallbackLabel, isPending, labels } = model

  return (
    <li className="border-t border-border first:border-t-0">
      <div className="flex items-stretch gap-5 py-8 lg:gap-6">
        {renderProductLink(
          model.imageUrl ? (
            <img
              alt={model.name}
              className="h-full w-full object-cover object-center transition duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
              loading="lazy"
              src={model.imageUrl}
            />
          ) : (
            <ProductImageFallbackView label={imageFallbackLabel} />
          ),
          'group block aspect-product w-32 shrink-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-36',
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-x-4">
            <div className="max-w-xl min-w-0">
              {renderProductLink(
                model.name,
                'block text-xs leading-4 font-normal tracking-wider text-foreground uppercase transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              )}
              <CartDisplayOptionsView
                className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs leading-5 text-muted-foreground"
                model={{ options: model.displayOptions }}
                optionClassName="inline-flex items-center gap-x-2"
              />
              <div className="mt-4">
                <MoneyDisplayView {...model.unitPrice} variant="listing" />
              </div>
            </div>

            <div className="shrink-0 self-start text-right">
              <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
                {labels.total}
              </p>
              <div className="mt-2">
                <MoneyDisplayView {...model.totalPrice} />
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end gap-x-5 gap-y-4 pt-6">
            {quantitySelector}
            <button
              aria-label={labels.removeItem}
              className="text-xs tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
