import { Link } from '@tanstack/react-router'

import type { MessageKey } from '@/lib/i18n/messages'
import {
  HeaderDesktopActionView,
  HeaderMobileActionView,
} from '@/components/layout/header-action-view'
import { HeaderActionsView } from '@/components/layout/header-actions-view'
import { HeaderSheetTriggerView } from '@/components/layout/header-sheet-trigger-view'

import type { useLazyHeaderDrawer } from './use-lazy-header-drawer'

const SEARCH_TRIGGER_DESKTOP_ID = 'storefront-search-trigger-desktop'
const SEARCH_TRIGGER_MOBILE_ID = 'storefront-search-trigger-mobile'
const CART_TRIGGER_DESKTOP_ID = 'storefront-cart-trigger-desktop'
const CART_TRIGGER_MOBILE_ID = 'storefront-cart-trigger-mobile'

type HeaderDrawer = Pick<
  ReturnType<typeof useLazyHeaderDrawer>,
  'getTriggerProps' | 'open'
>

type HeaderActionsProps = {
  cartDrawer: HeaderDrawer
  itemCount: number
  marketParams: { country: string; locale: string }
  onPreloadCart: () => void
  onPreloadSearch: () => void
  searchDrawer: HeaderDrawer
  t: (key: MessageKey) => string
}

export function HeaderActions({
  cartDrawer,
  itemCount,
  marketParams,
  onPreloadCart,
  onPreloadSearch,
  searchDrawer,
  t,
}: HeaderActionsProps) {
  return (
    <HeaderActionsView
      slots={{
        desktopAccount: (
          <HeaderDesktopActionView
            renderAction={(content, className) => (
              <Link
                aria-label={t('header.myAccount')}
                className={className}
                params={marketParams}
                preload={false}
                to="/$country/$locale/account"
              >
                {content}
              </Link>
            )}
            withLeadingSpacing
          >
            {t('header.account')}
          </HeaderDesktopActionView>
        ),
        desktopCart: (
          <HeaderDesktopActionView
            renderAction={(content, className) => (
              <HeaderSheetTriggerView
                ariaLabel={t('header.viewCart')}
                className={className}
                dataUnderlineActive={cartDrawer.open ? 'true' : undefined}
                onPreload={onPreloadCart}
                triggerProps={cartDrawer.getTriggerProps(
                  CART_TRIGGER_DESKTOP_ID,
                )}
              >
                {content}
              </HeaderSheetTriggerView>
            )}
            withLeadingSpacing
          >
            {t('header.bag')}
            {itemCount > 0 ? ` (${itemCount})` : ''}
          </HeaderDesktopActionView>
        ),
        desktopSearch: (
          <HeaderDesktopActionView
            renderAction={(content, className) => (
              <HeaderSheetTriggerView
                ariaLabel={t('header.searchProducts')}
                className={className}
                onPreload={onPreloadSearch}
                triggerProps={searchDrawer.getTriggerProps(
                  SEARCH_TRIGGER_DESKTOP_ID,
                )}
              >
                {content}
              </HeaderSheetTriggerView>
            )}
          >
            {t('header.search')}
          </HeaderDesktopActionView>
        ),
        mobileAccount: (
          <HeaderMobileActionView
            icon="account"
            renderAction={(content, className) => (
              <Link
                aria-label={t('header.myAccount')}
                className={className}
                params={marketParams}
                preload={false}
                to="/$country/$locale/account"
              >
                {content}
              </Link>
            )}
          />
        ),
        mobileCart: (
          <HeaderMobileActionView
            count={itemCount}
            icon="cart"
            renderAction={(content, className) => (
              <HeaderSheetTriggerView
                ariaLabel={t('header.viewCart')}
                className={className}
                onPreload={onPreloadCart}
                triggerProps={cartDrawer.getTriggerProps(
                  CART_TRIGGER_MOBILE_ID,
                )}
              >
                {content}
              </HeaderSheetTriggerView>
            )}
          />
        ),
        mobileSearch: (
          <HeaderMobileActionView
            icon="search"
            renderAction={(content, className) => (
              <HeaderSheetTriggerView
                ariaLabel={t('header.searchProducts')}
                className={className}
                onPreload={onPreloadSearch}
                triggerProps={searchDrawer.getTriggerProps(
                  SEARCH_TRIGGER_MOBILE_ID,
                )}
              >
                {content}
              </HeaderSheetTriggerView>
            )}
          />
        ),
      }}
    />
  )
}
