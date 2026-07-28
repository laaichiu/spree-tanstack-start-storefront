import { Link, useLocation } from '@tanstack/react-router'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { useMarket } from '@/components/layout/market-provider'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { cn } from '@/lib/utils'

import {
  categoryPathMatches,
  isSaleCategory,
  MENU_CLOSE_DELAY_MS,
  topLevelClass,
} from './desktop-mega-menu/desktop-mega-menu.model'

const DesktopMegaMenuPanel = lazy(async () => {
  const module = await import('./desktop-mega-menu/desktop-mega-menu-panel')
  return { default: module.DesktopMegaMenuPanel }
})

type DesktopMegaMenuProps = {
  categories: CategoryNavigationItem[]
}

export function DesktopMegaMenu({ categories }: DesktopMegaMenuProps) {
  const { market, t } = useMarket()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const suppressFocusOpenRef = useRef(false)
  const triggerRefs = useRef(new Map<string, HTMLAnchorElement>())
  const marketParams = { country: market.country, locale: market.locale }
  const activeCategory = useMemo(
    () =>
      categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, categories],
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

  const closeCategory = useCallback(() => {
    setActiveCategoryId(null)
  }, [])

  const handleCategoryEnter = useCallback(
    (category: CategoryNavigationItem) => {
      if (suppressFocusOpenRef.current) {
        return
      }

      if (category.children.length > 0) {
        setActiveCategoryId(category.id)
        return
      }

      closeCategory()
    },
    [closeCategory],
  )

  const cancelScheduledClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelScheduledClose()
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      closeCategory()
    }, MENU_CLOSE_DELAY_MS)
  }, [cancelScheduledClose, closeCategory])

  useEffect(() => {
    return () => cancelScheduledClose()
  }, [cancelScheduledClose])

  useEffect(() => {
    if (!activeCategoryId) {
      return
    }

    const openCategoryId = activeCategoryId

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      suppressFocusOpenRef.current = true
      closeCategory()
      triggerRefs.current.get(openCategoryId)?.focus()
      window.setTimeout(() => {
        suppressFocusOpenRef.current = false
      }, 0)
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closeCategory()
      }
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        closeCategory()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [activeCategoryId, closeCategory])

  if (categories.length === 0) {
    return null
  }

  const activePanelId = activeCategory
    ? `desktop-mega-menu-panel-${activeCategory.id}`
    : undefined

  return (
    <div className="hidden min-w-0 lg:block" ref={rootRef}>
      <nav
        aria-label={t('header.categories')}
        className="flex h-full min-w-0 items-stretch gap-5 xl:gap-7"
        onMouseEnter={cancelScheduledClose}
        onMouseLeave={scheduleClose}
        onPointerEnter={cancelScheduledClose}
        onPointerLeave={scheduleClose}
      >
        {categories.map((category) => {
          const hasChildren = category.children.length > 0
          const isOpen = activeCategoryId === category.id
          const isCurrentCategory = currentCategoryId === category.id
          const isActive = isOpen || isCurrentCategory

          return (
            <Link
              aria-controls={hasChildren && isOpen ? activePanelId : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-haspopup={hasChildren ? 'true' : undefined}
              className={cn(
                topLevelClass,
                isSaleCategory(category.name)
                  ? 'text-destructive'
                  : 'text-foreground',
              )}
              data-underline-active={isActive ? 'true' : undefined}
              key={category.id}
              onClick={closeCategory}
              onFocus={() => handleCategoryEnter(category)}
              onMouseEnter={() => handleCategoryEnter(category)}
              onPointerEnter={() => handleCategoryEnter(category)}
              params={{ ...marketParams, _splat: category.permalink }}
              ref={(node) => {
                if (node) {
                  triggerRefs.current.set(category.id, node)
                } else {
                  triggerRefs.current.delete(category.id)
                }
              }}
              search={DEFAULT_PRODUCT_LISTING_SEARCH}
              to="/$country/$locale/collections/$"
            >
              {category.name}
            </Link>
          )
        })}
      </nav>

      {activeCategory && activePanelId ? (
        <Suspense fallback={null}>
          <DesktopMegaMenuPanel
            activeCategory={activeCategory}
            activePanelId={activePanelId}
            marketParams={marketParams}
            onCancelScheduledClose={cancelScheduledClose}
            onClose={closeCategory}
            onScheduleClose={scheduleClose}
            panelRef={panelRef}
            pathname={pathname}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
