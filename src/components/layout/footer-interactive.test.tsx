import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DeferredFooterMarketSelector,
  DeferredFooterNewsletterSignup,
} from './footer-interactive'

vi.mock('@/components/layout/market-selector', () => ({
  MarketSelector: () => <button type="button">Market selector</button>,
}))

vi.mock('@/components/sections/newsletter-signup-form', () => ({
  NewsletterSignupForm: () => <form aria-label="Newsletter form" />,
}))

afterEach(cleanup)

describe('footer interactive slots', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: undefined,
    })
  })

  it('loads the newsletter form after the fallback mounts', async () => {
    render(<DeferredFooterNewsletterSignup retryLabel="Try again" />)

    expect(screen.queryByRole('form')).toBeNull()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
    expect(
      await screen.findByRole('form', { name: 'Newsletter form' }),
    ).toBeTruthy()
  })

  it('loads the market selector without requiring an observer', async () => {
    render(<DeferredFooterMarketSelector retryLabel="Try again" />)

    expect(
      await screen.findByRole('button', { name: 'Market selector' }),
    ).toBeTruthy()
  })

  it('waits for the slot to approach the viewport when observers are available', async () => {
    let observeCallback: IntersectionObserverCallback | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        observeCallback = callback
      }

      disconnect = disconnect
      observe = observe
    }

    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: MockIntersectionObserver,
    })

    render(<DeferredFooterNewsletterSignup retryLabel="Try again" />)

    expect(screen.queryByRole('form')).toBeNull()
    expect(observe).toHaveBeenCalledTimes(1)
    observeCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(screen.queryByRole('form')).toBeNull()

    observeCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(
      await screen.findByRole('form', { name: 'Newsletter form' }),
    ).toBeTruthy()
    expect(disconnect).toHaveBeenCalled()
  })
})
