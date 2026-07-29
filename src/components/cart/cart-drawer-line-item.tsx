import { Link } from '@tanstack/react-router'

import { CartQuantitySelector } from '@/components/cart/cart-quantity-selector'
import type { CartLineItem } from '@/lib/cart/model/cart'
import {
  getOptionSwatchClass,
  isColorOption,
} from '@/lib/catalog/option-swatch'
import { formatMoney } from '@/lib/money/format-money'
import type { Money } from '@/lib/money/money'
import { useMarket } from '@/components/layout/market-provider'
import { cn } from '@/lib/utils'

import { getCartDisplayOptions } from './cart-display-options'

type CartDrawerLineItemProps = {
  item: CartLineItem
  marketParams: { country: string; locale: string }
  onClose: () => void
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  pending: boolean
}

function CartMoney({
  className,
  price,
}: {
  className?: string
  price: Money | null
}) {
  const { market } = useMarket()

  return (
    <span
      className={cn(
        'text-2xl leading-none font-normal text-foreground',
        className,
      )}
    >
      {formatMoney(price, market.locale)}
    </span>
  )
}

export function CartDrawerLineItem({
  item,
  marketParams,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  pending,
}: CartDrawerLineItemProps) {
  const { t } = useMarket()
  const displayOptions = getCartDisplayOptions(item)

  return (
    <li className="px-5" key={item.id}>
      <div className="flex items-stretch gap-4 border-b border-border py-6 last:border-b-0">
        <Link
          className="block aspect-product w-32 shrink-0 overflow-hidden bg-muted focus-visible:focus-ring"
          onClick={onClose}
          params={{ ...marketParams, slug: item.productSlug }}
          to="/$country/$locale/products/$slug"
        >
          {item.imageUrl ? (
            <img
              alt={item.name}
              className="h-full w-full object-cover"
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
            <div className="min-w-0">
              <Link
                className="block text-sm leading-5 font-normal tracking-wider text-foreground uppercase transition hover:text-muted-foreground focus-visible:focus-ring"
                onClick={onClose}
                params={{ ...marketParams, slug: item.productSlug }}
                to="/$country/$locale/products/$slug"
              >
                {item.name}
              </Link>
              {displayOptions.length > 0 ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm leading-5 text-muted-foreground">
                  {displayOptions.map((option, optionIndex) => {
                    const isColor = isColorOption(
                      option.optionTypeLabel || option.optionTypeName,
                    )

                    return (
                      <span
                        className="inline-flex items-center gap-x-3"
                        key={option.id}
                      >
                        {optionIndex > 0 ? (
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            |
                          </span>
                        ) : null}
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
            </div>

            <CartMoney
              className="shrink-0 text-right text-sm leading-5"
              price={item.totalPrice}
            />
          </div>

          <div className="mt-auto flex flex-wrap items-end gap-x-5 gap-y-4 pt-6">
            <CartQuantitySelector
              disabled={pending}
              onUpdateQuantity={(quantity) =>
                onUpdateQuantity(item.id, quantity)
              }
              quantity={item.quantity}
              size="drawer"
            />
            <button
              aria-label={t('cart.removeItem')}
              className="pb-1 text-sm tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
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
