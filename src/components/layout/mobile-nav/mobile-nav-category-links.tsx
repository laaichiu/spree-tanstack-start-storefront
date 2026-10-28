import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { MobileNavCategoryActionView } from '@/components/layout/mobile-nav-category-action-view'
import { isSaleCategory } from '@/components/layout/navigation-category-display'

type MobileNavCategoryLinksProps = {
  allLabel?: string
  categories: CategoryNavigationItem[]
  marketParams: { country: string; locale: string }
  onClose: () => void
  onOpenCategory: (category: CategoryNavigationItem) => void
  parentCategory?: CategoryNavigationItem
  showSaleTone?: boolean
}

export function MobileNavCategoryLinks({
  allLabel,
  categories,
  marketParams,
  onClose,
  onOpenCategory,
  parentCategory,
  showSaleTone = false,
}: MobileNavCategoryLinksProps) {
  return (
    <>
      {parentCategory && allLabel && (
        <CategoryLink
          category={parentCategory}
          label={`${allLabel} ${parentCategory.name}`}
          marketParams={marketParams}
          onClose={onClose}
        />
      )}

      {categories.map((category) => (
        <CategoryLink
          category={category}
          key={category.id}
          marketParams={marketParams}
          onClose={onClose}
          onOpenCategory={onOpenCategory}
          tone={showSaleTone && isSaleCategory(category) ? 'sale' : 'default'}
        />
      ))}
    </>
  )
}

function CategoryLink({
  category,
  label = category.name,
  marketParams,
  onClose,
  onOpenCategory,
  tone = 'default',
}: {
  category: CategoryNavigationItem
  label?: string
  marketParams: { country: string; locale: string }
  onClose: () => void
  onOpenCategory?: (category: CategoryNavigationItem) => void
  tone?: 'default' | 'sale'
}) {
  const hasChildren = category.children.length > 0

  return (
    <MobileNavCategoryActionView
      hasChevron={hasChildren && Boolean(onOpenCategory)}
      renderAction={(content, className) =>
        hasChildren && onOpenCategory ? (
          <button
            className={className}
            onClick={() => onOpenCategory(category)}
            type="button"
          >
            {content}
          </button>
        ) : (
          <Link
            className={className}
            onClick={onClose}
            params={{ ...marketParams, _splat: category.permalink }}
            search={DEFAULT_PRODUCT_LISTING_SEARCH}
            to="/$country/$locale/collections/$"
          >
            {content}
          </Link>
        )
      }
      tone={tone}
    >
      {label}
    </MobileNavCategoryActionView>
  )
}

export type { MobileNavCategoryLinksProps }
