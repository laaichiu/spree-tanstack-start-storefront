import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/model/cart'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import type {
  ResolvedMarket,
  StorefrontMarket,
} from '@/lib/market/model/market'

import type { StorefrontBranding } from './storefront-branding'

export type StorefrontShellCapabilities = {
  cart: {
    freeShippingPromotion: CartFreeShippingPromotion | null
    initialCart: CartSummary | null
    initialLoadError: string | null
  }
  navigation: {
    categories: CategoryNavigationItem[]
  }
}

export type StorefrontShellData = {
  branding: StorefrontBranding
  capabilities: StorefrontShellCapabilities
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  shouldRedirect: boolean
}

export type StorefrontShellResolution = Pick<
  StorefrontShellData,
  'market' | 'marketOptions' | 'shouldRedirect'
>
