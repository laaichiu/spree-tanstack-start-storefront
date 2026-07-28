import { Link } from '@tanstack/react-router'
import { createPortal } from 'react-dom'

import { useMarket } from '@/components/layout/market-provider'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { cn } from '@/lib/utils'

import {
  categoryPathEquals,
  categoryPathMatches,
  panelLinkClass,
} from './desktop-mega-menu.model'

type DesktopMegaMenuPanelProps = {
  activeCategory: CategoryNavigationItem
  activePanelId: string
  marketParams: { country: string; locale: string }
  onClose: () => void
  onCancelScheduledClose: () => void
  onScheduleClose: () => void
  panelRef: React.RefObject<HTMLDivElement | null>
  pathname: string
}

export function DesktopMegaMenuPanel({
  activeCategory,
  activePanelId,
  marketParams,
  onCancelScheduledClose,
  onClose,
  onScheduleClose,
  panelRef,
  pathname,
}: DesktopMegaMenuPanelProps) {
  const { market, t } = useMarket()

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <>
      <button
        aria-label={t('header.closeMenu')}
        className="fixed inset-x-0 top-[5rem] bottom-0 z-40 cursor-default bg-black/40"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label={activeCategory.name}
        className="fixed inset-x-0 top-[5rem] z-50 border-b border-border bg-background"
        id={activePanelId}
        onMouseEnter={onCancelScheduledClose}
        onMouseLeave={onScheduleClose}
        onPointerEnter={onCancelScheduledClose}
        onPointerLeave={onScheduleClose}
        ref={panelRef}
        role="region"
      >
        <div aria-hidden="true" className="h-px w-full bg-border" />
        <div className="mx-auto flex max-w-[min(100vw-3rem,88rem)] justify-center px-8 py-10 xl:px-12">
          <div
            className={cn(
              'grid items-start',
              activeCategory.imageUrl
                ? 'grid-cols-[max-content_17rem] gap-x-24'
                : 'grid-cols-[minmax(14rem,19rem)]',
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wider text-foreground uppercase">
                {activeCategory.name}
              </p>
              <nav
                aria-label={activeCategory.name}
                className="mt-5 space-y-3.5"
              >
                <Link
                  className={panelLinkClass}
                  data-underline-active={
                    categoryPathEquals({
                      category: activeCategory,
                      country: market.country,
                      locale: market.locale,
                      pathname,
                    })
                      ? 'true'
                      : undefined
                  }
                  key={`view-all-${activeCategory.id}`}
                  onClick={onClose}
                  params={{ ...marketParams, _splat: activeCategory.permalink }}
                  search={DEFAULT_PRODUCT_LISTING_SEARCH}
                  to="/$country/$locale/collections/$"
                >
                  {t('home.all')} {activeCategory.name}
                </Link>

                {activeCategory.children.map((child) => (
                  <Link
                    className={panelLinkClass}
                    data-underline-active={
                      categoryPathMatches({
                        category: child,
                        country: market.country,
                        locale: market.locale,
                        pathname,
                      })
                        ? 'true'
                        : undefined
                    }
                    key={child.id}
                    onClick={onClose}
                    params={{ ...marketParams, _splat: child.permalink }}
                    search={DEFAULT_PRODUCT_LISTING_SEARCH}
                    to="/$country/$locale/collections/$"
                  >
                    {child.name}
                  </Link>
                ))}
              </nav>
            </div>

            {activeCategory.imageUrl ? (
              <Link
                className="group block text-foreground focus-visible:focus-ring"
                onClick={onClose}
                params={{ ...marketParams, _splat: activeCategory.permalink }}
                search={DEFAULT_PRODUCT_LISTING_SEARCH}
                to="/$country/$locale/collections/$"
              >
                <div className="relative aspect-product w-[17rem] overflow-hidden bg-muted">
                  <img
                    alt={activeCategory.name}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                    src={activeCategory.imageUrl}
                  />
                </div>
                <p className="pt-3 text-sm font-normal tracking-wider uppercase">
                  {t('home.shop')} {activeCategory.name}
                </p>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
