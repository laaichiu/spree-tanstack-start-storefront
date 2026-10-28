import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '../cart/contracts/cart'
import type { CategoryNavigationItem } from '../catalog/contracts/category'
import type { ResolvedMarket, StorefrontMarket } from '@/lib/core/market'
import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'

/**
 * Normalized storefront identity and SEO metadata for theme consumption.
 *
 * Branding resolution and persistence remain in the storefront runtime.
 */
export type StorefrontBranding = {
  locale: string
  logoUrl: string | null
  metaDescription: string | null
  name: string
  seoTitle: string | null
}

/**
 * Safe, serializable capabilities provided to the storefront shell.
 *
 * Cart session loading, navigation requests, and mutation lifecycles remain
 * owned by the storefront runtime.
 */
export type StorefrontShellCapabilities = {
  brands: BrandNavigation
  cart: {
    freeShippingPromotion: CartFreeShippingPromotion | null
    initialCart: CartSummary | null
    initialLoadError: string | null
  }
  navigation: {
    categories: CategoryNavigationItem[]
  }
}

/**
 * Serializable data required to compose the storefront shell.
 *
 * Market resolution and branding loading remain runtime responsibilities.
 */
export type StorefrontShellData = {
  branding: StorefrontBranding
  capabilities: StorefrontShellCapabilities
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  shouldRedirect: boolean
}

/**
 * The market-only portion of the shell contract used before deferred shell
 * capabilities are loaded.
 */
export type StorefrontShellResolution = Pick<
  StorefrontShellData,
  'market' | 'marketOptions' | 'shouldRedirect'
>
