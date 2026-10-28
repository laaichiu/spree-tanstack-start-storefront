import { useMarket } from '@/components/layout/market-provider'
import { CartQuantitySelectorView } from '@/components/cart/cart-quantity-selector-view'

type CartQuantitySelectorProps = {
  disabled?: boolean
  maxQuantity?: number
  onUpdateQuantity: (quantity: number) => Promise<void>
  quantity: number
  size?: 'drawer' | 'page'
}

export function CartQuantitySelector({
  disabled = false,
  maxQuantity = 99,
  onUpdateQuantity,
  quantity,
  size = 'page',
}: CartQuantitySelectorProps) {
  const { t } = useMarket()

  return (
    <CartQuantitySelectorView
      model={{
        decreaseLabel: t('cart.decreaseQuantity'),
        disabled,
        increaseLabel: t('cart.increaseQuantity'),
        maxQuantity,
        quantity,
        quantityLabel: t('cart.quantity'),
        size,
      }}
      onUpdateQuantity={onUpdateQuantity}
    />
  )
}
