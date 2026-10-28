import { useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'

import { categoryPathMatches } from '@/lib/catalog/contracts'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'

import { useMarket } from './market-provider'
import { useDesktopMegaMenu } from './use-desktop-mega-menu'

export function useDesktopMegaMenuController({
  brands,
  categories,
}: {
  brands: BrandNavigation
  categories: CategoryNavigationItem[]
}) {
  const { market, t } = useMarket()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const marketParams = { country: market.country, locale: market.locale }
  const menu = useDesktopMegaMenu()
  const brandMenuId = 'brands'
  const isBrandsOpen = brands.enabled && menu.activeItemId === brandMenuId
  const activeCategory = useMemo(
    () =>
      categories.find((category) => category.id === menu.activeItemId) ?? null,
    [categories, menu.activeItemId],
  )
  const currentCategoryId = useMemo(() => {
    const currentCategory = categories.find((category) =>
      categoryPathMatches({
        category,
        country: market.country,
        locale: market.locale,
        pathname,
      }),
    )

    return currentCategory?.id ?? null
  }, [categories, market.country, market.locale, pathname])
  const activePanelId =
    activeCategory || isBrandsOpen
      ? `desktop-mega-menu-panel-${menu.activeItemId}`
      : undefined

  useEffect(() => {
    menu.closeMenu()
  }, [market.country, market.locale, pathname, menu.closeMenu])

  return {
    ...menu,
    activeCategory,
    activePanelId,
    brandMenuId,
    isBrandsOpen,
    isCurrentBrand:
      pathname === `/${market.country}/${market.locale}/brands` ||
      brands.items.some(
        (brand) =>
          pathname === `/${market.country}/${market.locale}/${brand.slug}`,
      ) ||
      (brands.featuredBrand !== null &&
        pathname ===
          `/${market.country}/${market.locale}/${brands.featuredBrand.slug}`),
    handleBrandsEnter: () =>
      menu.handleItemEnter({ id: brandMenuId, hasPanel: brands.enabled }),
    handleCategoryEnter: (category: CategoryNavigationItem) =>
      menu.handleItemEnter({
        id: category.id,
        hasPanel: category.children.length > 0,
      }),
    currentCategoryId,
    marketParams,
    pathname,
    t,
  }
}
