import { useEffect } from 'react'

import type { SheetHandle } from '@/components/ui/sheet'
import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/contracts'
import { CartDrawerHeaderView } from '@/components/cart/cart-drawer-header-view'
import { CartDrawerShellView } from '@/components/cart/cart-drawer-shell-view'

import { CartDrawerBody } from './cart-drawer-body'
import { CartDrawerFooter } from './cart-drawer-footer'
import { useCartDrawerController } from './use-cart-drawer-controller'

type CartDrawerProps = {
  freeShippingPromotion: CartFreeShippingPromotion | null
  handle: SheetHandle
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  onReady: () => void
  open: boolean
  triggerId: string | null
}

export function CartDrawer({
  freeShippingPromotion,
  handle,
  initialCart,
  initialCartLoadError,
  onOpenChange,
  onReady,
  open,
  triggerId,
}: CartDrawerProps) {
  const { body, footer, headerModel } = useCartDrawerController({
    freeShippingPromotion,
    initialCart,
    initialCartLoadError,
  })

  useEffect(() => {
    onReady()
  }, [onReady])

  return (
    <CartDrawerShellView
      actions={{ openChange: onOpenChange }}
      handle={handle}
      open={open}
      slots={{
        body: (
          <CartDrawerBody
            cartMutationError={body.cartMutationError}
            isCartMutationPending={body.isCartMutationPending}
            isResetPending={body.isResetPending}
            marketParams={body.marketParams}
            model={body.model}
            onClose={() => onOpenChange(false)}
            onRecoverCartSession={body.onRecoverCartSession}
            onRemoveItem={body.onRemoveItem}
            onUpdateQuantity={body.onUpdateQuantity}
          />
        ),
        footer: footer && (
          <CartDrawerFooter
            amounts={footer.amounts}
            cartId={footer.cartId}
            marketParams={footer.marketParams}
            onClose={() => onOpenChange(false)}
            shippingSummary={footer.shippingSummary}
          />
        ),
        header: (
          <CartDrawerHeaderView
            model={headerModel}
            onClose={() => onOpenChange(false)}
          />
        ),
      }}
      triggerId={triggerId}
    />
  )
}
