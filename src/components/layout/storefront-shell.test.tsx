import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  NEWSLETTER_POPUP_DEFER_MS,
  StorefrontShell,
} from '@/components/layout/storefront-shell'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'

const shellMocks = vi.hoisted(() => ({
  dismissed: false,
  pathname: '/us/en',
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => string
  }) => select({ location: { pathname: shellMocks.pathname } }),
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ capabilities }: { capabilities: StorefrontShellCapabilities }) => (
    <div data-testid="header">
      {capabilities.navigation.categories.length} categories
    </div>
  ),
}))

vi.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('@/components/layout/newsletter-popup', () => ({
  NewsletterPopup: ({
    onAccepted,
    onDismiss,
  }: {
    onAccepted: () => void
    onDismiss: () => void
  }) => (
    <div data-testid="newsletter-popup">
      <button onClick={onAccepted} type="button">
        Accept
      </button>
      <button onClick={onDismiss} type="button">
        Dismiss
      </button>
    </div>
  ),
}))

vi.mock('@/components/layout/newsletter-popup-dismissal', () => ({
  isNewsletterPopupDismissed: () => shellMocks.dismissed,
}))

const capabilities: StorefrontShellCapabilities = {
  cart: {
    freeShippingPromotion: null,
    initialCart: null,
    initialLoadError: null,
  },
  navigation: {
    categories: [
      {
        children: [],
        id: 'category-kitchen',
        imageUrl: null,
        name: 'Kitchen',
        permalink: 'kitchen',
      },
    ],
  },
}

afterEach(() => {
  cleanup()
  shellMocks.dismissed = false
  shellMocks.pathname = '/us/en'
  vi.useRealTimers()
})

describe('StorefrontShell', () => {
  it('composes shared layout from normalized capability inputs', async () => {
    vi.useFakeTimers()

    render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    expect(screen.getByTestId('header').textContent).toBe('1 categories')
    expect(screen.getByRole('main').textContent).toBe('Page content')
    expect(screen.getByTestId('footer')).toBeTruthy()
    expect(screen.queryByTestId('newsletter-popup')).toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS - 1)
    })
    expect(screen.queryByTestId('newsletter-popup')).toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(screen.getByTestId('newsletter-popup')).toBeTruthy()
  })

  it('does not load a dismissed popup', async () => {
    vi.useFakeTimers()
    shellMocks.dismissed = true

    render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS)
    })

    expect(screen.queryByTestId('newsletter-popup')).toBeNull()
  })

  it('cancels and reschedules popup loading across route eligibility changes', async () => {
    vi.useFakeTimers()
    const view = render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS / 2)
    })

    shellMocks.pathname = '/us/en/checkout'
    view.rerender(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS)
    })
    expect(screen.queryByTestId('newsletter-popup')).toBeNull()

    shellMocks.pathname = '/us/en/products'
    view.rerender(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS)
    })
    expect(screen.getByTestId('newsletter-popup')).toBeTruthy()
  })

  it('unmounts the popup after dismissal', async () => {
    vi.useFakeTimers()

    render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByTestId('newsletter-popup')).toBeNull()
  })

  it('keeps the accepted state visible until navigation', async () => {
    vi.useFakeTimers()
    const view = render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(NEWSLETTER_POPUP_DEFER_MS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    expect(screen.getByTestId('newsletter-popup')).toBeTruthy()

    shellMocks.pathname = '/us/en/products'
    view.rerender(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    expect(screen.queryByTestId('newsletter-popup')).toBeNull()
  })

  it('keeps the shell contract outside session and commerce infrastructure', () => {
    const files = [
      'src/components/layout/storefront-shell.tsx',
      'src/components/layout/storefront-shell.model.ts',
    ]
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')

    expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
    expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
    expect(source).not.toMatch(/\.server(?:'|")/)
    expect(source).not.toMatch(/token|queryClient|serverFn/)
  })
})
