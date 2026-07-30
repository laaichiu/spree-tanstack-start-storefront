import '@tanstack/react-start/server-only'

import { getCartForMarket } from '@/lib/cart/api/cart-read.server'
import { getConfiguredCartFreeShippingPromotion } from '@/lib/cart/config/free-shipping'
import { getNavigationCategoriesForMarket } from '@/lib/catalog/api/get-navigation-categories.server'
import { getStorefrontMarketsForRequest } from '@/lib/market/api/get-storefront-markets.server'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { resolveMarketSelection } from '@/lib/market/utils/market'
import {
  isBrowserFetchFailureError,
  reportError,
} from '@/lib/observability/report-error'
import { translateMessage } from '@/lib/i18n/messages'

import type {
  StorefrontShellCapabilities,
  StorefrontShellData,
  StorefrontShellResolution,
} from '../model/storefront-shell'

type LoadStorefrontShellInput = MarketSelectionInput & {
  useCheckoutShell: boolean
}

function createEmptyCapabilities(
  currencyCode: string,
): StorefrontShellCapabilities {
  return {
    cart: {
      freeShippingPromotion:
        getConfiguredCartFreeShippingPromotion(currencyCode),
      initialCart: null,
      initialLoadError: null,
    },
    navigation: {
      categories: [],
    },
  }
}

export async function loadStorefrontShellForRequest({
  country,
  locale,
  useCheckoutShell,
}: LoadStorefrontShellInput): Promise<StorefrontShellData> {
  const resolution = await resolveStorefrontShellForRequest({
    country,
    locale,
  })

  return loadStorefrontShellForResolution({ resolution, useCheckoutShell })
}

export async function resolveStorefrontShellForRequest({
  country,
  locale,
}: MarketSelectionInput): Promise<StorefrontShellResolution> {
  const marketOptions = await getStorefrontMarketsForRequest({
    country,
    locale,
  })
  const selection = resolveMarketSelection(marketOptions, { country, locale })
  const { market, shouldRedirect } = selection

  return { market, marketOptions, shouldRedirect }
}

export async function loadStorefrontShellForResolution({
  resolution,
  useCheckoutShell,
}: {
  resolution: StorefrontShellResolution
  useCheckoutShell: boolean
}): Promise<StorefrontShellData> {
  const { market, marketOptions, shouldRedirect } = resolution

  if (shouldRedirect || useCheckoutShell) {
    return {
      capabilities: createEmptyCapabilities(market.currencyCode),
      market,
      marketOptions,
      shouldRedirect,
    }
  }

  const [navigationCategories, cartResult] = await Promise.all([
    getNavigationCategoriesForMarket({ market, limit: 7 }).catch(
      (error: unknown) => {
        if (!isBrowserFetchFailureError(error)) {
          reportError({
            context: 'layout.navigationCategories',
            error,
          })
        }

        return []
      },
    ),
    getCartForMarket(market).then(
      (cart) => ({
        cart,
        error: null,
      }),
      (error: unknown) => {
        reportError({
          context: 'layout.cart',
          error,
        })

        return {
          cart: null,
          error: translateMessage(
            market.locale,
            'cart.cartLoadFailedDescription',
          ),
        }
      },
    ),
  ])

  return {
    capabilities: {
      cart: {
        freeShippingPromotion: getConfiguredCartFreeShippingPromotion(
          market.currencyCode,
        ),
        initialCart: cartResult.cart,
        initialLoadError: cartResult.error,
      },
      navigation: {
        categories: navigationCategories,
      },
    },
    market,
    marketOptions,
    shouldRedirect,
  }
}
