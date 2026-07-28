import { useMarket } from '@/components/layout/market-provider'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { SheetHandle } from '@/components/ui/sheet'
import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/model/cart'
import { getConfirmedCartDeliveryTotal } from '@/lib/cart/utils/cart-shipping'
import { getCartFreeShippingProgress } from '@/lib/cart/utils/free-shipping'
import { formatMoney } from '@/lib/money/format-money'

import { CartDrawerBody } from './cart-drawer-body'
import { CartDrawerFooter } from './cart-drawer-footer'
import { CartDrawerHeader } from './cart-drawer-header'
import { useCart } from './use-cart'
import { useCartItemMutations } from './use-cart-item-mutations'

type CartDrawerProps = {
  freeShippingPromotion: CartFreeShippingPromotion | null
  handle: SheetHandle
  initialCart?: CartSummary | null
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  open: boolean
  triggerId: string | null
}

export function CartDrawer({
  freeShippingPromotion,
  handle,
  initialCart,
  onOpenChange,
  open,
  triggerId,
}: CartDrawerProps) {
  const { market, t } = useMarket()
  const { data: cart, error, isLoading } = useCart({ initialCart })
  const {
    cartMutationError,
    isResetPending,
    pendingLineItemId,
    recoverCartSession,
    removeItem,
    updateQuantity,
  } = useCartItemMutations({ errorMessage: t('cart.cartMutationFailed') })
  const marketParams = { country: market.country, locale: market.locale }
  const items = cart?.items ?? []
  const itemCount = cart?.itemCount ?? 0
  const activeCart = cart && cart.items.length > 0 ? cart : null
  const freeShippingProgress =
    activeCart && freeShippingPromotion
      ? getCartFreeShippingProgress(activeCart, freeShippingPromotion)
      : null
  const shippingHeaderMessage = freeShippingProgress
    ? freeShippingProgress.isThresholdReached
      ? t('cart.freeShippingReceived')
      : t('cart.freeShippingSpendMore').replace(
          '{amount}',
          formatMoney(freeShippingProgress.remaining, market.locale),
        )
    : null
  const itemCountLabel = `${itemCount} ${
    itemCount === 1 ? t('cart.itemSingular') : t('cart.itemPlural')
  }`
  const confirmedDeliveryTotal = activeCart
    ? getConfirmedCartDeliveryTotal(activeCart)
    : null
  const shippingSummaryLabel = activeCart
    ? confirmedDeliveryTotal
      ? confirmedDeliveryTotal.amount === 0
        ? t('cart.free')
        : formatMoney(confirmedDeliveryTotal, market.locale)
      : t('cart.calculatedAtCheckout')
    : null

  return (
    <Sheet
      handle={handle}
      onOpenChange={(nextOpen, eventDetails) =>
        onOpenChange(nextOpen, eventDetails.trigger?.id ?? null)
      }
      open={open}
      triggerId={triggerId}
    >
      <SheetContent>
        <CartDrawerHeader
          activeCart={activeCart}
          freeShippingProgress={freeShippingProgress}
          itemCountLabel={itemCountLabel}
          onClose={() => onOpenChange(false)}
          shippingHeaderMessage={shippingHeaderMessage}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          <CartDrawerBody
            activeCart={activeCart}
            cartMutationError={cartMutationError}
            error={error}
            isLoading={isLoading}
            isResetPending={isResetPending}
            items={items}
            marketParams={marketParams}
            onClose={() => onOpenChange(false)}
            onRecoverCartSession={recoverCartSession}
            onRemoveItem={removeItem}
            onUpdateQuantity={updateQuantity}
            pendingLineItemId={pendingLineItemId}
          />

          {activeCart && !isLoading && !error ? (
            <CartDrawerFooter
              activeCart={activeCart}
              marketParams={marketParams}
              onClose={() => onOpenChange(false)}
              shippingSummaryLabel={shippingSummaryLabel ?? ''}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
