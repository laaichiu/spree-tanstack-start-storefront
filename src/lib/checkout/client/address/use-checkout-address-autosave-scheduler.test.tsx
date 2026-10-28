import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutAddressAutosaveScheduler } from './use-checkout-address-autosave-scheduler'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('checkout address autosave scheduler', () => {
  it('runs a scheduled autosave while mounted', () => {
    vi.useFakeTimers()
    const attemptAutoSaveAddress = vi
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useCheckoutAddressAutosaveScheduler({
        attemptAutoSaveAddressRef: { current: attemptAutoSaveAddress },
      }),
    )

    act(() => {
      result.current.scheduleAutoSaveAddress()
      vi.advanceTimersByTime(600)
    })

    expect(attemptAutoSaveAddress).toHaveBeenCalledOnce()
  })

  it('does not reschedule an autosave after unmount', () => {
    vi.useFakeTimers()
    const attemptAutoSaveAddress = vi
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined)
    const { result, unmount } = renderHook(() =>
      useCheckoutAddressAutosaveScheduler({
        attemptAutoSaveAddressRef: { current: attemptAutoSaveAddress },
      }),
    )

    unmount()

    act(() => {
      result.current.scheduleAutoSaveAddress()
      vi.advanceTimersByTime(1_200)
    })

    expect(attemptAutoSaveAddress).not.toHaveBeenCalled()
  })
})
