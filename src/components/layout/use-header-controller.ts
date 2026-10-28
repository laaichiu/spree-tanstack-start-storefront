import { useEffect } from 'react'

import { useCart } from '@/lib/cart/client/use-cart-query'

import { useMarket } from './market-provider'
import type { StorefrontShellCapabilities } from './storefront-shell.model'
import { useLazyHeaderDrawer } from './use-lazy-header-drawer'

type UseHeaderControllerOptions = {
  capabilities: StorefrontShellCapabilities
  onPreloadCart: () => void
  onPreloadSearch: () => void
}

export function useHeaderController({
  capabilities,
  onPreloadCart,
  onPreloadSearch,
}: UseHeaderControllerOptions) {
  const { market, t } = useMarket()
  const { freeShippingPromotion, initialCart } = capabilities.cart
  const { data: cart } = useCart({ initialCart, market })
  const cartDrawer = useLazyHeaderDrawer()
  const searchDrawer = useLazyHeaderDrawer()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  useEffect(() => {
    function handleOpenCart() {
      cartDrawer.openProgrammatically()
    }

    window.addEventListener('spree-storefront:open-cart', handleOpenCart)

    return () => {
      window.removeEventListener('spree-storefront:open-cart', handleOpenCart)
    }
  }, [cartDrawer.openProgrammatically])

  return {
    cart: {
      freeShippingPromotion,
      initialCart,
      initialLoadError: capabilities.cart.initialLoadError,
    },
    cartDrawer,
    categories: capabilities.navigation.categories,
    brands: capabilities.brands,
    itemCount: cart?.itemCount ?? 0,
    marketParams,
    onPreloadCart,
    onPreloadSearch,
    searchDrawer,
    t,
  }
}
