import { Link } from '@tanstack/react-router'

import { getCartLineItemPresentation } from '@/components/cart/cart-line-item-display'
import { CartQuantitySelector } from '@/components/cart/cart-quantity-selector'
import { useMarket } from '@/components/layout/market-provider'
import type { CartLineItem } from '@/lib/cart/contracts'
import { CartLineItemView } from '@/components/cart/cart-line-item-view'

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
  const display = getCartLineItemPresentation(item, market.locale)

  return (
    <CartLineItemView
      model={{
        displayOptions: display.displayOptions,
        imageFallbackLabel: t('product.imageComingSoon'),
        imageUrl: display.imageUrl,
        isPending,
        labels: {
          remove: t('cart.remove'),
          removeItem: t('cart.removeItem'),
          total: t('cart.total'),
        },
        name: display.name,
        totalPrice: display.totalPrice,
        unitPrice: display.unitPrice,
      }}
      onRemoveItem={() => onRemoveItem(display.id)}
      renderProductLink={(content, className) => (
        <Link
          className={className}
          params={{
            country: market.country,
            locale: market.locale,
            slug: display.productSlug,
          }}
          to="/$country/$locale/products/$slug"
        >
          {content}
        </Link>
      )}
      quantitySelector={
        <CartQuantitySelector
          disabled={isPending}
          onUpdateQuantity={(quantity) =>
            onUpdateQuantity(display.id, quantity)
          }
          quantity={display.quantity}
        />
      }
    />
  )
}
