import { Link } from '@tanstack/react-router'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import { BrandNavigationLinks } from '@/components/layout/brand-navigation-links'
import { BrandNavigationFeaturedLink } from '@/components/layout/brand-navigation-featured-link'
import { MobileNavCategoryActionView } from '@/components/layout/mobile-nav-category-action-view'
import { MarketSelector } from '@/components/layout/market-selector'
import type { MessageKey } from '@/lib/i18n/messages'
import type { MobileNavPanel } from '@/components/contracts/layout'
import {
  MobileNavCategoryPanelView,
  MobileNavMainPanelView,
  MobileNavPanelsView,
} from '@/components/layout/mobile-nav-panels-view'
import { MobileNavSecondaryLinkView } from '@/components/layout/mobile-nav-secondary-link-view'

import { MobileNavCategoryLinks } from './mobile-nav-category-links'

type MobileNavPanelsProps = {
  actions: MobileNavPanelsActions
  animatedIndex: number
  brands: BrandNavigation
  categories: CategoryNavigationItem[]
  isPopping: boolean
  marketParams: { country: string; locale: string }
  panelStack: readonly MobileNavPanel<CategoryNavigationItem>[]
  t: (key: MessageKey) => string
}

type MobileNavPanelsActions = {
  close: () => void
  popPanel: () => void
  pushPanel: (panel: MobileNavPanel<CategoryNavigationItem>) => void
}

export function MobileNavPanels({
  actions,
  animatedIndex,
  brands,
  categories,
  isPopping,
  marketParams,
  panelStack,
  t,
}: MobileNavPanelsProps) {
  const isNestedPanel = panelStack.length > 1
  const mainCategoryLinks = (
    <MobileNavCategoryLinks
      categories={categories}
      marketParams={marketParams}
      onClose={actions.close}
      onOpenCategory={(category) =>
        actions.pushPanel({ category, kind: 'category' })
      }
      showSaleTone
    />
  )

  const nestedPanels = panelStack.flatMap((panel, stackIndex) => {
    if (panel.kind === 'brands') {
      const id = 'menu-brands'
      return [
        {
          content: (
            <MobileNavCategoryPanelView
              backLabel={t('header.back')}
              categoryLinks={
                <BrandNavigationLinks
                  allLabel={t('brand.viewAllBrands')}
                  brands={brands}
                  marketParams={marketParams}
                  mobile
                  onClose={actions.close}
                />
              }
              featuredLink={
                <BrandNavigationFeaturedLink
                  brand={brands.featuredBrand}
                  label={`${t('home.shop')} ${brands.featuredBrand?.name ?? ''}`}
                  marketParams={marketParams}
                  onClose={actions.close}
                />
              }
              heading={t('brand.featuredBrands')}
              onBack={actions.popPanel}
              title={t('brand.directory')}
            />
          ),
          id,
          stackIndex,
        },
      ]
    }

    if (panel.kind !== 'category') {
      return []
    }

    const categoryLinks = (
      <MobileNavCategoryLinks
        allLabel={t('home.all')}
        categories={panel.category.children}
        marketParams={marketParams}
        onClose={actions.close}
        onOpenCategory={(category) =>
          actions.pushPanel({ category, kind: 'category' })
        }
        parentCategory={panel.category}
      />
    )

    const id = `menu-category-${panel.category.id}-${panel.category.permalink}`
    return [
      {
        content: (
          <MobileNavCategoryPanelView
            backLabel={t('header.back')}
            categoryLinks={categoryLinks}
            onBack={actions.popPanel}
            title={panel.category.name}
          />
        ),
        id,
        stackIndex,
      },
    ]
  })

  return (
    <MobileNavPanelsView
      animatedIndex={animatedIndex}
      isPopping={isPopping}
      isNestedPanel={isNestedPanel}
      mainPanel={
        <MobileNavMainPanelView
          categoriesLabel={t('header.categories')}
          slots={{
            accountLink: (
              <MobileNavSecondaryLinkView
                renderLink={(content, className) => (
                  <Link
                    className={className}
                    onClick={actions.close}
                    params={marketParams}
                    preload={false}
                    to="/$country/$locale/account"
                  >
                    {content}
                  </Link>
                )}
              >
                {t('header.myAccount')}
              </MobileNavSecondaryLinkView>
            ),
            brandLink: brands.enabled && (
              <MobileNavCategoryActionView
                hasChevron
                renderAction={(content, className) => (
                  <button
                    className={className}
                    onClick={() => actions.pushPanel({ kind: 'brands' })}
                    type="button"
                  >
                    {content}
                  </button>
                )}
              >
                {t('brand.directory')}
              </MobileNavCategoryActionView>
            ),
            categoryLinks: mainCategoryLinks,
            marketSelector: <MarketSelector variant="menu" />,
          }}
        />
      }
      nestedPanels={nestedPanels}
    />
  )
}
