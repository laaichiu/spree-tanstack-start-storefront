import type { CartSummary } from '@/lib/cart/model/cart'

import { CartPageController } from './cart-page-controller'
import { CartPageReferenceView } from './cart-page-reference-view'

type CartPageContentProps = {
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
}

export function CartPageContent({
  initialCart,
  initialCartLoadError = null,
}: CartPageContentProps = {}) {
  return (
    <CartPageController
      initialCart={initialCart}
      initialCartLoadError={initialCartLoadError}
    >
      {(controller) => <CartPageReferenceView controller={controller} />}
    </CartPageController>
  )
}
