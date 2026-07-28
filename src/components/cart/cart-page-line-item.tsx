import { Link } from '@tanstack/react-router'

import { CartQuantitySelector } from '@/components/cart/cart-quantity-selector'
import { useMarket } from '@/components/layout/market-provider'
import { ProductPrice } from '@/components/shared/product-price'
import type { CartLineItem } from '@/lib/cart/model/cart'
import { getCartDisplayOptions } from '@/components/cart/cart-display-options'
import {
  getOptionSwatchClass,
  isColorOption,
} from '@/lib/catalog/option-swatch'
import { cn } from '@/lib/utils'

type CartPageLineItemProps = {
  item: CartLineItem
  isPending: boolean
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
}

export function CartPageLineItem({
  isPending,
  item,
  onRemoveItem,
  onUpdateQuantity,
}: CartPageLineItemProps) {
  const { market, t } = useMarket()
  const marketParams = { country: market.country, locale: market.locale }
  const displayOptions = getCartDisplayOptions(item)

  return (
    <li className="border-t border-border first:border-t-0">
      <div className="flex items-stretch gap-5 py-8 lg:gap-6">
        <Link
          className="group block aspect-product w-32 shrink-0 overflow-hidden bg-muted focus-visible:focus-ring sm:w-36"
          params={{ ...marketParams, slug: item.productSlug }}
          to="/$country/$locale/products/$slug"
        >
          {item.imageUrl ? (
            <img
              alt={item.name}
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
              src={item.imageUrl}
            />
          ) : (
            <div className="text-sm leading-6 flex h-full w-full items-center justify-center px-4 text-center text-muted-foreground">
              {t('product.imageComingSoon')}
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-x-4">
            <div className="max-w-xl min-w-0">
              <Link
                className="block text-sm leading-4 font-normal tracking-wider text-foreground uppercase transition-colors hover:text-muted-foreground focus-visible:focus-ring"
                params={{ ...marketParams, slug: item.productSlug }}
                to="/$country/$locale/products/$slug"
              >
                {item.name}
              </Link>
              {displayOptions.length > 0 ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm leading-5 text-muted-foreground">
                  {displayOptions.map((option, index) => {
                    const isColor = isColorOption(
                      option.optionTypeLabel || option.optionTypeName,
                    )

                    return (
                      <span
                        className="inline-flex items-center gap-x-2"
                        key={option.id}
                      >
                        {index > 0 ? <span aria-hidden="true">|</span> : null}
                        {isColor ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'h-2.5 w-2.5 rounded-full border border-input',
                              option.colorCode
                                ? null
                                : getOptionSwatchClass(option.label),
                            )}
                            style={
                              option.colorCode
                                ? { backgroundColor: option.colorCode }
                                : undefined
                            }
                          />
                        ) : null}
                        <span>{option.label}</span>
                      </span>
                    )
                  })}
                </p>
              ) : null}
              <div className="mt-4">
                <ProductPrice price={item.unitPrice} variant="listing" />
              </div>
            </div>

            <div className="shrink-0 self-start text-right">
              <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
                {t('cart.total')}
              </p>
              <div className="mt-2">
                <ProductPrice price={item.totalPrice} />
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end gap-x-5 gap-y-4 pt-6">
            <CartQuantitySelector
              disabled={isPending}
              onUpdateQuantity={(quantity) =>
                onUpdateQuantity(item.id, quantity)
              }
              quantity={item.quantity}
            />
            <button
              aria-label={t('cart.removeItem')}
              className="text-sm tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending}
              onClick={() => void onRemoveItem(item.id)}
              type="button"
            >
              {t('cart.remove')}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
