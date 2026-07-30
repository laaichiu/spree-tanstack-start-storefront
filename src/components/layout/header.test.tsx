import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { useEffect } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Header } from './header'
import type { StorefrontShellCapabilities } from './storefront-shell.model'

const drawerModuleMocks = vi.hoisted(() => ({
  baseUiHandlerPrevented: vi.fn(),
  cartLoaded: vi.fn(),
  searchLoaded: vi.fn(),
}))

type MockSheetHandle = Record<string, never>

type MockSheetOpenChange = (open: boolean, triggerId?: string | null) => void

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}))

vi.mock('@/components/cart/use-cart', () => ({
  useCart: () => ({ data: null }),
}))

vi.mock('@/components/ui/sheet', () => ({
  createSheetHandle: (): MockSheetHandle => ({}),
  SheetTrigger: ({
    children,
    handle: _handle,
    onClick,
    ...props
  }: ComponentProps<'button'> & { handle: MockSheetHandle }) => (
    <button
      {...props}
      onClick={(event) => {
        onClick?.(
          Object.assign(event, {
            preventBaseUIHandler: drawerModuleMocks.baseUiHandlerPrevented,
          }),
        )
      }}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) =>
      ({
        'header.account': 'Account',
        'header.bag': 'Bag',
        'header.myAccount': 'My account',
        'header.search': 'Search',
        'header.searchProducts': 'Search products',
        'header.viewCart': 'View cart',
      })[key] ?? key,
  }),
}))

vi.mock('./announcement-banner', () => ({
  AnnouncementBanner: () => null,
}))

vi.mock('./desktop-mega-menu', () => ({
  DesktopMegaMenu: () => null,
}))

vi.mock('./mobile-nav', () => ({
  MobileNav: () => null,
}))

vi.mock('./search-drawer', () => {
  drawerModuleMocks.searchLoaded()

  return {
    SearchDrawer: ({
      onOpenChange,
      onReady,
      open,
      triggerId,
    }: {
      onOpenChange: MockSheetOpenChange
      onReady: () => void
      open: boolean
      triggerId: string | null
    }) => {
      useEffect(() => {
        onReady()
      }, [onReady])

      return (
        <div
          data-open={open}
          data-testid="search-drawer"
          data-trigger-id={triggerId}
        >
          <button onClick={() => onOpenChange(false)} type="button">
            Close mocked search
          </button>
        </div>
      )
    },
  }
})

vi.mock('@/components/cart/cart-drawer', () => {
  drawerModuleMocks.cartLoaded()

  return {
    CartDrawer: ({
      onOpenChange,
      onReady,
      open,
      triggerId,
    }: {
      onOpenChange: MockSheetOpenChange
      onReady: () => void
      open: boolean
      triggerId: string | null
    }) => {
      useEffect(() => {
        onReady()
      }, [onReady])

      return (
        <div
          data-open={open}
          data-testid="cart-drawer"
          data-trigger-id={triggerId}
        >
          <button onClick={() => onOpenChange(false)} type="button">
            Close mocked cart
          </button>
        </div>
      )
    },
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderHeader() {
  const capabilities: StorefrontShellCapabilities = {
    cart: {
      freeShippingPromotion: null,
      initialCart: null,
      initialLoadError: null,
    },
    navigation: { categories: [] },
  }

  return render(<Header capabilities={capabilities} />)
}

async function expectDrawerOpen(testId: string) {
  await waitFor(() => {
    expect(screen.getByTestId(testId).getAttribute('data-open')).toBe('true')
  })
}

async function expectDrawerClosed(testId: string) {
  await waitFor(() => {
    expect(screen.getByTestId(testId).getAttribute('data-open')).toBe('false')
  })
}

describe('Header drawers', () => {
  it('defers drawer modules until interaction intent', async () => {
    renderHeader()

    expect(screen.queryByTestId('search-drawer')).toBeNull()
    expect(screen.queryByTestId('cart-drawer')).toBeNull()
    expect(drawerModuleMocks.searchLoaded).not.toHaveBeenCalled()
    expect(drawerModuleMocks.cartLoaded).not.toHaveBeenCalled()

    fireEvent.mouseEnter(screen.getByText('Search'))

    await waitFor(() => {
      expect(drawerModuleMocks.searchLoaded).toHaveBeenCalledTimes(1)
    })
    expect(drawerModuleMocks.cartLoaded).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Bag'))
    await expectDrawerOpen('cart-drawer')
  })

  it('keeps the search drawer mounted so its detached trigger can reopen it', async () => {
    renderHeader()

    expect(screen.queryByTestId('search-drawer')).toBeNull()

    fireEvent.click(screen.getByText('Search'))
    await expectDrawerOpen('search-drawer')
    expect(drawerModuleMocks.baseUiHandlerPrevented).toHaveBeenCalledOnce()
    expect(
      screen.getByTestId('search-drawer').getAttribute('data-trigger-id'),
    ).toBe('storefront-search-trigger-desktop')

    fireEvent.click(screen.getByText('Close mocked search'))
    await expectDrawerClosed('search-drawer')

    fireEvent.click(screen.getByText('Search'))
    await expectDrawerOpen('search-drawer')
    expect(drawerModuleMocks.baseUiHandlerPrevented).toHaveBeenCalledTimes(2)
  })

  it('keeps the cart drawer mounted so its detached trigger can reopen it', async () => {
    renderHeader()

    expect(screen.queryByTestId('cart-drawer')).toBeNull()

    fireEvent.click(screen.getByText('Bag'))
    await expectDrawerOpen('cart-drawer')
    expect(drawerModuleMocks.baseUiHandlerPrevented).toHaveBeenCalledOnce()
    expect(
      screen.getByTestId('cart-drawer').getAttribute('data-trigger-id'),
    ).toBe('storefront-cart-trigger-desktop')

    fireEvent.click(screen.getByText('Close mocked cart'))
    await expectDrawerClosed('cart-drawer')

    fireEvent.click(screen.getByText('Bag'))
    await expectDrawerOpen('cart-drawer')
    expect(drawerModuleMocks.baseUiHandlerPrevented).toHaveBeenCalledTimes(2)
  })
})
