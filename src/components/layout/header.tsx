import { lazy, Suspense } from 'react'
import { Link } from '@tanstack/react-router'

import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'
import type { StorefrontBranding } from '@/lib/storefront/contracts'
import { HeaderView } from '@/components/layout/header-view'
import { HeaderBrandView } from '@/components/layout/header-brand-view'

import { AnnouncementBanner } from './announcement-banner'
import { DesktopMegaMenu } from './desktop-mega-menu'
import { HeaderActions } from './header-actions'
import { MobileNav } from './mobile-nav'
import { useHeaderController } from './use-header-controller'

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

const CartDrawer = lazy(async () => {
  const module = await loadCartDrawer()
  return { default: module.CartDrawer }
})

const SearchDrawer = lazy(async () => {
  const module = await loadSearchDrawer()
  return { default: module.SearchDrawer }
})

export function Header({
  branding,
  capabilities,
}: {
  branding: StorefrontBranding
  capabilities: StorefrontShellCapabilities
}) {
  const {
    cart,
    cartDrawer,
    categories,
    brands,
    itemCount,
    marketParams,
    onPreloadCart,
    onPreloadSearch,
    searchDrawer,
    t,
  } = useHeaderController({
    capabilities,
    onPreloadCart: preloadCartDrawer,
    onPreloadSearch: preloadSearchDrawer,
  })

  return (
    <>
      <HeaderView
        slots={{
          actions: (
            <HeaderActions
              cartDrawer={cartDrawer}
              itemCount={itemCount}
              marketParams={marketParams}
              onPreloadCart={onPreloadCart}
              onPreloadSearch={onPreloadSearch}
              searchDrawer={searchDrawer}
              t={t}
            />
          ),
          announcement: (
            <AnnouncementBanner
              freeShippingPromotion={cart.freeShippingPromotion}
            />
          ),
          brand: (
            <Link
              aria-label={`${branding.name} home`}
              className="absolute left-1/2 inline-flex -translate-x-1/2 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 xl:static xl:translate-x-0 xl:justify-self-center"
              params={marketParams}
              to="/$country/$locale"
            >
              <HeaderBrandView
                logoUrl={branding.logoUrl}
                name={branding.name}
              />
            </Link>
          ),
          desktopNavigation: (
            <DesktopMegaMenu brands={brands} categories={categories} />
          ),
          mobileNavigation: (
            <MobileNav brands={brands} categories={categories} />
          ),
        }}
      />
      {searchDrawer.isMounted && (
        <Suspense fallback={null}>
          <SearchDrawer
            handle={searchDrawer.handle}
            onReady={searchDrawer.handleMount}
            onOpenChange={searchDrawer.handleOpenChange}
            open={searchDrawer.open}
            triggerId={searchDrawer.triggerId}
          />
        </Suspense>
      )}
      {cartDrawer.isMounted && (
        <Suspense fallback={null}>
          <CartDrawer
            freeShippingPromotion={cart.freeShippingPromotion}
            handle={cartDrawer.handle}
            initialCart={cart.initialCart}
            initialCartLoadError={cart.initialLoadError}
            onReady={cartDrawer.handleMount}
            onOpenChange={cartDrawer.handleOpenChange}
            open={cartDrawer.open}
            triggerId={cartDrawer.triggerId}
          />
        </Suspense>
      )}
    </>
  )
}
