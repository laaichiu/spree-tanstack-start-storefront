import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBanner } from './announcement-banner'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { locale: 'en' },
    t: (key: string) =>
      ({
        'header.announcementFreeShipping':
          'Free shipping on orders over {amount}.',
        'header.announcementLabel': 'Store announcements',
        'header.announcementNewArrivals': 'New arrivals just landed.',
      })[key] ?? key,
  }),
}))

function getAnnouncementTrack() {
  const firstMessage = screen.getAllByText(
    'Free shipping on orders over $100.00.',
  )[0]

  if (!firstMessage.parentElement) {
    throw new Error('Expected the announcement track to exist')
  }

  return firstMessage.parentElement
}

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 16),
    )
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) =>
      window.clearTimeout(frameId),
    )
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resets the loop when the transition end event is interrupted', () => {
    render(
      <AnnouncementBanner
        freeShippingPromotion={{
          comparison: 'greaterThan',
          threshold: { amount: 100, currencyCode: 'USD' },
        }}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(getAnnouncementTrack().style.transform).toBe(
      'translate3d(0, -66.66666666666667%, 0)',
    )

    act(() => {
      vi.advanceTimersByTime(832)
    })

    expect(getAnnouncementTrack().style.transform).toBe(
      'translate3d(0, -0%, 0)',
    )

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(getAnnouncementTrack().style.transform).toBe(
      'translate3d(0, -33.333333333333336%, 0)',
    )
    expect(
      screen.getByText('New arrivals just landed.').getAttribute('aria-hidden'),
    ).toBe('false')
  })

  it('omits free-shipping claims when no threshold is configured', () => {
    render(<AnnouncementBanner freeShippingPromotion={null} />)

    expect(screen.queryByText(/Free shipping/)).toBeNull()
    expect(screen.getByText('New arrivals just landed.')).toBeTruthy()
  })
})
