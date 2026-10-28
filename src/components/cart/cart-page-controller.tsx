import type { ReactNode } from 'react'

import type { CartSummary } from '@/lib/cart/contracts'
import { CartPageController as RuntimeCartPageController } from '@/lib/cart/client/cart-page-controller'
import type { CartPageControllerValue } from '@/lib/cart/client/cart-page-controller'

import { useMarket } from '@/components/layout/market-provider'

export type {
  CartPageControllerValue,
  CartPageItemActions,
  CartPageRecoveryCapability,
} from '@/lib/cart/client/cart-page-controller'

type CartPageControllerProps = {
  children: (controller: CartPageControllerValue) => ReactNode
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
}

export function CartPageController({
  children,
  initialCart,
  initialCartLoadError = null,
}: CartPageControllerProps) {
  const { market, t } = useMarket()

  return (
    <RuntimeCartPageController
      errorMessage={t('cart.cartMutationFailed')}
      initialCart={initialCart}
      initialCartLoadError={initialCartLoadError}
      market={market}
    >
      {children}
    </RuntimeCartPageController>
  )
}
