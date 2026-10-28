import { Link } from '@tanstack/react-router'

import { getCartLineItemPresentation } from '@/components/cart/cart-line-item-display'
import type { CartLineItem } from '@/lib/cart/contracts'

import { CartQuantitySelector } from '@/components/cart/cart-quantity-selector'
import { useMarket } from '@/components/layout/market-provider'
import { CartDrawerLineItemView } from '@/components/cart/cart-drawer-line-item-view'

type CartDrawerLineItemProps = {
  item: CartLineItem
  marketParams: { country: string; locale: string }
  onClose: () => void
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  pending: boolean
}

export function CartDrawerLineItem({
  item,
  marketParams,
  onClose,
  onRemoveItem,
  onUpdateQuantity,
  pending,
}: CartDrawerLineItemProps) {
  const { market, t } = useMarket()
  const display = getCartLineItemPresentation(item, market.locale)

  return (
    <CartDrawerLineItemView
      model={{
        displayOptions: display.displayOptions,
        imageFallbackLabel: t('product.imageComingSoon'),
        imageUrl: display.imageUrl,
        isPending: pending,
        labels: {
          remove: t('cart.remove'),
          removeItem: t('cart.removeItem'),
        },
        name: display.name,
        totalPrice: display.totalPrice,
      }}
      onRemoveItem={() => onRemoveItem(display.id)}
      renderProductLink={(content, className) => (
        <Link
          className={className}
          onClick={onClose}
          params={{ ...marketParams, slug: display.productSlug }}
          to="/$country/$locale/products/$slug"
        >
          {content}
        </Link>
      )}
      quantitySelector={
        <CartQuantitySelector
          disabled={pending}
          onUpdateQuantity={(quantity) =>
            onUpdateQuantity(display.id, quantity)
          }
          quantity={display.quantity}
          size="drawer"
        />
      }
    />
  )
}
