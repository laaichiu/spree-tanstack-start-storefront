import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import {
  DEFAULT_PRODUCT_LISTING_SEARCH,
  categoryPathEquals,
  categoryPathMatches,
} from '@/lib/catalog/contracts'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { DesktopMegaMenuPanelLinkView } from '@/components/layout/desktop-mega-menu-panel-link-view'

type DesktopMegaMenuCategoryLinksProps = {
  activeCategory: CategoryNavigationItem
  allLabel: string
  marketParams: { country: string; locale: string }
  onClose: () => void
  pathname: string
}

export function DesktopMegaMenuCategoryLinks({
  activeCategory,
  allLabel,
  marketParams,
  onClose,
  pathname,
}: DesktopMegaMenuCategoryLinksProps) {
  return (
    <>
      <DesktopMegaMenuPanelLinkView
        key={`view-all-${activeCategory.id}`}
        renderLink={(content, className) => (
          <CategoryLink
            category={activeCategory}
            className={className}
            isActive={categoryPathEquals({
              category: activeCategory,
              country: marketParams.country,
              locale: marketParams.locale,
              pathname,
            })}
            marketParams={marketParams}
            onClose={onClose}
          >
            {content}
          </CategoryLink>
        )}
      >
        {allLabel} {activeCategory.name}
      </DesktopMegaMenuPanelLinkView>

      {activeCategory.children.map((child) => (
        <DesktopMegaMenuPanelLinkView
          key={child.id}
          renderLink={(content, className) => (
            <CategoryLink
              category={child}
              className={className}
              isActive={categoryPathMatches({
                category: child,
                country: marketParams.country,
                locale: marketParams.locale,
                pathname,
              })}
              marketParams={marketParams}
              onClose={onClose}
            >
              {content}
            </CategoryLink>
          )}
        >
          {child.name}
        </DesktopMegaMenuPanelLinkView>
      ))}
    </>
  )
}

function CategoryLink({
  category,
  children,
  className,
  isActive,
  marketParams,
  onClose,
}: {
  category: CategoryNavigationItem
  children: ReactNode
  className?: string
  isActive: boolean
  marketParams: { country: string; locale: string }
  onClose: () => void
}) {
  return (
    <Link
      className={className}
      data-underline-active={isActive ? 'true' : undefined}
      onClick={onClose}
      params={{ ...marketParams, _splat: category.permalink }}
      search={DEFAULT_PRODUCT_LISTING_SEARCH}
      to="/$country/$locale/collections/$"
    >
      {children}
    </Link>
  )
}

export type { DesktopMegaMenuCategoryLinksProps }
