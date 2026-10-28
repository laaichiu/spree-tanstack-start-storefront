import type { MutableRefObject } from 'react'
import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { DesktopMegaMenuLinkView } from '@/components/layout/desktop-mega-menu-link-view'
import { isSaleCategory } from '@/components/layout/navigation-category-display'

type DesktopMegaMenuCategoryTriggersProps = {
  activeCategoryId: string | null
  activePanelId?: string
  categories: CategoryNavigationItem[]
  currentCategoryId: string | null
  marketParams: { country: string; locale: string }
  onCategoryEnter: (category: CategoryNavigationItem) => void
  onClose: () => void
  triggerRefs: MutableRefObject<Map<string, HTMLAnchorElement>>
}

export function DesktopMegaMenuCategoryTriggers({
  activeCategoryId,
  activePanelId,
  categories,
  currentCategoryId,
  marketParams,
  onCategoryEnter,
  onClose,
  triggerRefs,
}: DesktopMegaMenuCategoryTriggersProps) {
  return (
    <>
      {categories.map((category) => {
        const isOpen = activeCategoryId === category.id
        const isCurrentCategory = currentCategoryId === category.id
        const hasChildren = category.children.length > 0

        return (
          <DesktopMegaMenuLinkView
            key={category.id}
            renderLink={(content, className) => (
              <Link
                aria-controls={
                  hasChildren && isOpen ? activePanelId : undefined
                }
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-haspopup={hasChildren ? 'true' : undefined}
                className={className}
                data-underline-active={
                  isOpen || isCurrentCategory ? 'true' : undefined
                }
                onClick={onClose}
                onFocus={() => onCategoryEnter(category)}
                onMouseEnter={() => onCategoryEnter(category)}
                onPointerEnter={() => onCategoryEnter(category)}
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
                {content}
              </Link>
            )}
            tone={isSaleCategory(category) ? 'sale' : 'default'}
          >
            {category.name}
          </DesktopMegaMenuLinkView>
        )
      })}
    </>
  )
}

export type { DesktopMegaMenuCategoryTriggersProps }
