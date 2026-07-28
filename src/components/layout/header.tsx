import { Link } from '@tanstack/react-router'
import { Search, ShoppingBag, User } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'

import { SheetTrigger } from '@/components/ui/sheet'
import { useCart } from '@/components/cart/use-cart'
import { useMarket } from '@/components/layout/market-provider'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { cn } from '@/lib/utils'

import { AnnouncementBanner } from './announcement-banner'
import { DesktopMegaMenu } from './desktop-mega-menu'
import { MobileNav } from './mobile-nav'
import { storefrontCategoryLinks } from './storefront-navigation'
import { useLazyHeaderDrawer } from './use-lazy-header-drawer'

function loadCartDrawer() {
  return import('@/components/cart/cart-drawer')
}

function loadSearchDrawer() {
  return import('./search-drawer')
}

function preloadCartDrawer() {
  if (typeof window !== 'undefined') {
    void loadCartDrawer().catch(() => undefined)
  }
}

function preloadSearchDrawer() {
  if (typeof window !== 'undefined') {
    void loadSearchDrawer().catch(() => undefined)
  }
}

function preloadHeaderDrawers() {
  return Promise.all([loadCartDrawer(), loadSearchDrawer()])
}

const CartDrawer = lazy(async () => {
  const module = await loadCartDrawer()
  return { default: module.CartDrawer }
})

const SearchDrawer = lazy(async () => {
  const module = await loadSearchDrawer()
  return { default: module.SearchDrawer }
})

const headerActionClass =
  'link-underline-sweep text-sm leading-4 font-normal uppercase inline-flex h-12 items-center whitespace-nowrap text-foreground after:bottom-[0.6rem] focus-visible:focus-ring'

const preferredCategoryOrder = [
  'kitchen',
  'air',
  'garment',
  'floor',
  'personal',
] as const

const SEARCH_TRIGGER_DESKTOP_ID = 'storefront-search-trigger-desktop'
const SEARCH_TRIGGER_MOBILE_ID = 'storefront-search-trigger-mobile'
const CART_TRIGGER_DESKTOP_ID = 'storefront-cart-trigger-desktop'
const CART_TRIGGER_MOBILE_ID = 'storefront-cart-trigger-mobile'

function getPreferredCategoryIndex(category: CategoryNavigationItem) {
  const signature = `${category.name} ${category.permalink}`.toLowerCase()
  const index = preferredCategoryOrder.findIndex((item) =>
    signature.includes(item),
  )

  return index === -1 ? preferredCategoryOrder.length : index
}

function sortNavigationCategories(categories: CategoryNavigationItem[]) {
  return [...categories].sort(
    (first, second) =>
      getPreferredCategoryIndex(first) - getPreferredCategoryIndex(second),
  )
}

export function Header({
  capabilities,
}: {
  capabilities: StorefrontShellCapabilities
}) {
  const { market, t } = useMarket()
  const { freeShippingPromotion, initialCart } = capabilities.cart
  const navigationCategories = capabilities.navigation.categories
  const { data: cart } = useCart({ initialCart })
  const cartDrawer = useLazyHeaderDrawer()
  const searchDrawer = useLazyHeaderDrawer()
  const itemCount = cart?.itemCount ?? 0
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const desktopCategories =
    navigationCategories.length > 0
      ? sortNavigationCategories(navigationCategories)
      : storefrontCategoryLinks.map((item) => ({
          children: [
            {
              children: [],
              id: `${item.slug}-featured`,
              imageUrl: null,
              name: t(item.searchLabelKey),
              permalink: item.featuredSlug,
            },
          ],
          id: item.slug,
          imageUrl: null,
          name: t(item.labelKey),
          permalink: item.slug,
        }))

  useEffect(() => {
    function handleOpenCart() {
      cartDrawer.openProgrammatically()
    }

    window.addEventListener('spree-storefront:open-cart', handleOpenCart)

    return () => {
      window.removeEventListener('spree-storefront:open-cart', handleOpenCart)
    }
  }, [cartDrawer.openProgrammatically])

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void preloadHeaderDrawers().then(
        () => {
          if (!cancelled) {
            cartDrawer.mountClosed()
            searchDrawer.mountClosed()
          }
        },
        () => undefined,
      )
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [cartDrawer.mountClosed, searchDrawer.mountClosed])

  return (
    <>
      <header className="sticky top-0 z-30 bg-background lg:backdrop-blur">
        <AnnouncementBanner freeShippingPromotion={freeShippingPromotion} />
        <div className="border-b border-border bg-background">
          <div className="relative flex h-16 w-full items-center gap-2 px-4 lg:grid lg:h-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8">
            <DesktopMegaMenu categories={desktopCategories} />

            <MobileNav categories={desktopCategories} />

            <Link
              aria-label="Spree Storefront home"
              className="absolute left-1/2 inline-flex -translate-x-1/2 items-center justify-center focus-visible:focus-ring lg:static lg:translate-x-0 lg:justify-self-center"
              params={marketParams}
              to="/$country/$locale"
            >
              <img
                alt="Spree Storefront"
                className="h-8 w-auto object-contain lg:h-7"
                src="/spree.png"
              />
            </Link>

            <div className="ml-auto flex items-center justify-end lg:ml-0 lg:justify-self-end">
              <SheetTrigger
                {...searchDrawer.getTriggerProps(SEARCH_TRIGGER_DESKTOP_ID)}
                aria-label={t('header.searchProducts')}
                className={cn(headerActionClass, 'hidden lg:inline-flex')}
                onFocus={preloadSearchDrawer}
                onMouseEnter={preloadSearchDrawer}
                onPointerDown={preloadSearchDrawer}
                type="button"
              >
                {t('header.search')}
              </SheetTrigger>
              <SheetTrigger
                {...searchDrawer.getTriggerProps(SEARCH_TRIGGER_MOBILE_ID)}
                aria-label={t('header.searchProducts')}
                className="inline-flex rounded-sm p-2 text-foreground transition hover:bg-muted focus-visible:focus-ring lg:hidden"
                onFocus={preloadSearchDrawer}
                onMouseEnter={preloadSearchDrawer}
                onPointerDown={preloadSearchDrawer}
                type="button"
              >
                <Search aria-hidden="true" className="h-5 w-5" />
              </SheetTrigger>
              <Link
                aria-label={t('header.myAccount')}
                className={cn(headerActionClass, 'ml-5 hidden lg:inline-flex')}
                params={marketParams}
                preload={false}
                to="/$country/$locale/account"
              >
                {t('header.account')}
              </Link>
              <Link
                aria-label={t('header.myAccount')}
                className="hidden rounded-sm p-2 text-foreground transition hover:bg-muted focus-visible:focus-ring md:inline-flex lg:hidden"
                params={marketParams}
                preload={false}
                to="/$country/$locale/account"
              >
                <User aria-hidden="true" className="h-5 w-5" />
              </Link>
              <SheetTrigger
                aria-label={t('header.viewCart')}
                className={cn(headerActionClass, 'ml-5 hidden lg:inline-flex')}
                data-underline-active={cartDrawer.open ? 'true' : undefined}
                {...cartDrawer.getTriggerProps(CART_TRIGGER_DESKTOP_ID)}
                onFocus={preloadCartDrawer}
                onMouseEnter={preloadCartDrawer}
                onPointerDown={preloadCartDrawer}
                type="button"
              >
                {t('header.bag')}
                {itemCount > 0 ? ` (${itemCount})` : ''}
              </SheetTrigger>
              <SheetTrigger
                {...cartDrawer.getTriggerProps(CART_TRIGGER_MOBILE_ID)}
                aria-label={t('header.viewCart')}
                className="relative inline-flex rounded-sm p-2 text-foreground transition hover:bg-muted focus-visible:focus-ring lg:hidden"
                onFocus={preloadCartDrawer}
                onMouseEnter={preloadCartDrawer}
                onPointerDown={preloadCartDrawer}
                type="button"
              >
                <ShoppingBag aria-hidden="true" className="h-5 w-5" />
                {itemCount > 0 ? (
                  <span className="absolute top-0 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-sm font-semibold text-background">
                    {itemCount}
                  </span>
                ) : null}
              </SheetTrigger>
            </div>
          </div>
        </div>
      </header>
      {searchDrawer.isMounted ? (
        <Suspense fallback={null}>
          <SearchDrawer
            categories={desktopCategories}
            handle={searchDrawer.handle}
            onOpenChange={searchDrawer.handleOpenChange}
            open={searchDrawer.open}
            triggerId={searchDrawer.triggerId}
          />
        </Suspense>
      ) : null}
      {cartDrawer.isMounted ? (
        <Suspense fallback={null}>
          <CartDrawer
            freeShippingPromotion={freeShippingPromotion}
            handle={cartDrawer.handle}
            initialCart={initialCart}
            onOpenChange={cartDrawer.handleOpenChange}
            open={cartDrawer.open}
            triggerId={cartDrawer.triggerId}
          />
        </Suspense>
      ) : null}
    </>
  )
}
