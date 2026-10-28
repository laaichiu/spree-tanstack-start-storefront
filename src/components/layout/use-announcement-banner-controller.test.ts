// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAnnouncementBannerController } from './use-announcement-banner-controller'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useAnnouncementBannerController collection lifecycle', () => {
  it('resets the active message when same-length content changes', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ messages }: { messages: readonly string[] }) =>
        useAnnouncementBannerController(messages),
      { initialProps: { messages: ['Free shipping', 'New arrivals'] } },
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.activeIndex).toBe(1)

    rerender({ messages: ['Free returns', 'Member pricing'] })

    expect(result.current.activeIndex).toBe(0)
    expect(result.current.visibleIndex).toBe(0)
  })
})
