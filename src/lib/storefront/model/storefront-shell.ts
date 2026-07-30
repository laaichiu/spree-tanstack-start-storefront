import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/model/cart'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import type {
  ResolvedMarket,
  StorefrontMarket,
} from '@/lib/market/model/market'

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
  capabilities: StorefrontShellCapabilities
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  shouldRedirect: boolean
}

export type StorefrontShellResolution = Omit<
  StorefrontShellData,
  'capabilities'
>
