import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { MarketSelector } from '@/components/layout/market-selector'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/lib/utils'

import {
  chevronSlotClass,
  mainLinkClass,
  secondaryLinkClass,
} from './mobile-nav.model'
import type { MenuPanel } from './mobile-nav.model'

type MobileNavPanelsProps = {
  animatedIndex: number
  categories: CategoryNavigationItem[]
  marketParams: { country: string; locale: string }
  onClose: () => void
  onPopPanel: () => void
  onPushPanel: (panel: MenuPanel) => void
  panelStack: MenuPanel[]
  t: (key: MessageKey) => string
}

function MenuChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-2.5"
      fill="none"
      viewBox="0 0 10 18"
    >
      <path
        d="M2 2.25 8 9l-6 6.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function isSaleCategory(name: string) {
  return name.trim().toLowerCase().includes('sale')
}

export function MobileNavPanels({
  animatedIndex,
  categories,
  marketParams,
  onClose,
  onPopPanel,
  onPushPanel,
  panelStack,
  t,
}: MobileNavPanelsProps) {
  const currentPanel = panelStack[panelStack.length - 1] ?? { kind: 'main' }
  const isNestedPanel = currentPanel.kind === 'category'

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-popover">
      <div className="relative flex-1 overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 flex flex-col bg-popover transition-transform duration-300 ease-out',
            animatedIndex === 0 && !isNestedPanel
              ? 'translate-x-0'
              : '-translate-x-full',
          )}
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-8 pt-5 pb-8">
            <nav aria-label={t('header.categories')} className="space-y-0.5">
              {categories.map((category) => {
                const hasChildren = category.children.length > 0
                const toneClass = isSaleCategory(category.name)
                  ? 'text-destructive'
                  : null

                if (hasChildren) {
                  return (
                    <button
                      className={cn(mainLinkClass, toneClass)}
                      key={category.id}
                      onClick={() =>
                        onPushPanel({ category, kind: 'category' })
                      }
                      type="button"
                    >
                      <span>{category.name}</span>
                      <span aria-hidden="true" className={chevronSlotClass}>
                        <MenuChevronIcon />
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    className={cn(mainLinkClass, toneClass)}
                    key={category.id}
                    onClick={onClose}
                    params={{ ...marketParams, _splat: category.permalink }}
                    search={DEFAULT_PRODUCT_LISTING_SEARCH}
                    to="/$country/$locale/collections/$"
                  >
                    <span>{category.name}</span>
                    <span aria-hidden="true" className={chevronSlotClass} />
                  </Link>
                )
              })}
            </nav>

            <div className="mt-8 space-y-0.5 pt-2">
              <Link
                className={secondaryLinkClass}
                onClick={onClose}
                params={marketParams}
                preload={false}
                to="/$country/$locale/account"
              >
                <span>{t('header.myAccount')}</span>
              </Link>
            </div>
          </div>
          <div>
            <MarketSelector className="min-h-14" variant="menu" />
          </div>
        </div>

        {panelStack.map((panel, index) => {
          if (panel.kind !== 'category') {
            return null
          }

          const isAnimatedIn = index <= animatedIndex
          let translateClass = 'translate-x-full'

          if (isAnimatedIn && index < panelStack.length - 1) {
            translateClass = '-translate-x-full'
          } else if (isAnimatedIn) {
            translateClass = 'translate-x-0'
          }

          return (
            <div
              className={cn(
                'absolute inset-0 flex flex-col bg-popover transition-transform duration-300 ease-out',
                translateClass,
              )}
              key={`menu-category-${panel.category.id}-${panel.category.permalink}`}
            >
              <div className="relative flex min-h-16 items-center justify-center border-b border-border px-6 py-4">
                <button
                  aria-label={t('header.back')}
                  className="absolute left-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-opacity hover:opacity-65 focus-visible:focus-ring"
                  onClick={onPopPanel}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <p className="text-lg font-normal text-foreground">
                  {panel.category.name}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pt-8 pb-10">
                <h2 className="text-lg font-semibold tracking-wider text-foreground uppercase">
                  {panel.category.name}
                </h2>

                <nav className="mt-4 space-y-0.5">
                  <Link
                    className={mainLinkClass}
                    onClick={onClose}
                    params={{
                      ...marketParams,
                      _splat: panel.category.permalink,
                    }}
                    search={DEFAULT_PRODUCT_LISTING_SEARCH}
                    to="/$country/$locale/collections/$"
                  >
                    <span>
                      {t('home.all')} {panel.category.name}
                    </span>
                    <span aria-hidden="true" className={chevronSlotClass} />
                  </Link>

                  {panel.category.children.map((child) => {
                    const hasChildren = child.children.length > 0

                    if (hasChildren) {
                      return (
                        <button
                          className={mainLinkClass}
                          key={child.id}
                          onClick={() =>
                            onPushPanel({ category: child, kind: 'category' })
                          }
                          type="button"
                        >
                          <span>{child.name}</span>
                          <span aria-hidden="true" className={chevronSlotClass}>
                            <MenuChevronIcon />
                          </span>
                        </button>
                      )
                    }

                    return (
                      <Link
                        className={mainLinkClass}
                        key={child.id}
                        onClick={onClose}
                        params={{ ...marketParams, _splat: child.permalink }}
                        search={DEFAULT_PRODUCT_LISTING_SEARCH}
                        to="/$country/$locale/collections/$"
                      >
                        <span>{child.name}</span>
                        <span aria-hidden="true" className={chevronSlotClass} />
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
