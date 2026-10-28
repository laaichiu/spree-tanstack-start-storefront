import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { CartDrawerLineItem } from '@/components/cart/cart-drawer-line-item'
import type { CartDrawerModel } from '@/lib/cart/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { CartDrawerBodyView } from '@/components/cart/cart-drawer-body-view'
import { getCartDrawerBodyModel } from '@/components/cart/cart-drawer-body-display'

type CartDrawerBodyProps = {
  cartMutationError: string | null
  isCartMutationPending: boolean
  isResetPending: boolean
  marketParams: { country: string; locale: string }
  model: CartDrawerModel
  onClose: () => void
  onRecoverCartSession: () => Promise<void>
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
}

export function CartDrawerBody({
  cartMutationError,
  isCartMutationPending,
  isResetPending,
  marketParams,
  model,
  onClose,
  onRecoverCartSession,
  onRemoveItem,
  onUpdateQuantity,
}: CartDrawerBodyProps) {
  const { t } = useMarket()
  const bodyModel = getCartDrawerBodyModel({
    cartMutationError,
    isResetPending,
    model,
    t,
  })

  return (
    <CartDrawerBodyView
      items={
        model.status === 'ready' && (
          <ul>
            {model.cart.items.map((item) => (
              <CartDrawerLineItem
                item={item}
                key={item.id}
                marketParams={marketParams}
                onClose={onClose}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                pending={isCartMutationPending}
              />
            ))}
          </ul>
        )
      }
      model={bodyModel}
      onRecover={onRecoverCartSession}
      renderShopLink={(content, className) => (
        <Link
          className={className}
          onClick={onClose}
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {content}
        </Link>
      )}
    />
  )
}
