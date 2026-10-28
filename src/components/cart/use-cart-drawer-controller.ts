import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/contracts'
import { getCartDrawerHeaderDisplay } from '@/components/cart/cart-drawer-header-display'
import { useMarket } from '@/components/layout/market-provider'
import { useCartDrawerState } from '@/lib/cart/client/use-cart-drawer-state'

export function useCartDrawerController({
  freeShippingPromotion,
  initialCart,
  initialCartLoadError,
}: {
  freeShippingPromotion: CartFreeShippingPromotion | null
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
}) {
  const { market, t } = useMarket()
  const drawerState = useCartDrawerState({
    errorMessage: t('cart.cartMutationFailed'),
    freeShippingPromotion,
    initialCart,
    initialCartLoadError,
    market,
  })
  const marketParams = { country: market.country, locale: market.locale }
  const { model } = drawerState
  const itemCount = model.status === 'ready' ? model.cart.itemCount : 0
  const freeShippingProgress =
    model.status === 'ready' ? model.freeShippingProgress : null
  const headerDisplay = getCartDrawerHeaderDisplay({
    freeShippingProgress,
    itemCount,
    labels: {
      freeShippingReceived: t('cart.freeShippingReceived'),
      freeShippingSpendMore: t('cart.freeShippingSpendMore'),
      itemPlural: t('cart.itemPlural'),
      itemSingular: t('cart.itemSingular'),
    },
    locale: market.locale,
  })
  const headerModel = {
    ...headerDisplay,
    labels: {
      closeCart: t('cart.closeCart'),
      yourBag: t('cart.yourBag'),
    },
  }
  return {
    body: {
      cartMutationError: drawerState.cartMutationError,
      isCartMutationPending: drawerState.isCartMutationPending,
      isResetPending: drawerState.isResetPending,
      marketParams,
      model,
      onRecoverCartSession: drawerState.onRecoverCartSession,
      onRemoveItem: drawerState.onRemoveItem,
      onUpdateQuantity: drawerState.onUpdateQuantity,
    },
    footer:
      model.status === 'ready'
        ? {
            amounts: model.summary,
            cartId: model.cart.id,
            marketParams,
            shippingSummary: model.shippingSummary,
          }
        : null,
    headerModel,
  }
}
