import { useCallback, useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'

type CheckoutAddressAutosaveSchedulerOptions = {
  attemptAutoSaveAddressRef: MutableRefObject<() => Promise<void>>
}

export function useCheckoutAddressAutosaveScheduler({
  attemptAutoSaveAddressRef,
}: CheckoutAddressAutosaveSchedulerOptions) {
  const autoSaveAddressIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null)
  const autoSaveAddressTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const isMountedRef = useRef(true)

  const clearAutoSaveAddressTimeout = useCallback(() => {
    if (autoSaveAddressTimeoutRef.current) {
      clearTimeout(autoSaveAddressTimeoutRef.current)
      autoSaveAddressTimeoutRef.current = null
    }
  }, [])

  const clearAutoSaveAddressInterval = useCallback(() => {
    if (autoSaveAddressIntervalRef.current) {
      clearInterval(autoSaveAddressIntervalRef.current)
      autoSaveAddressIntervalRef.current = null
    }
  }, [])

  const scheduleAutoSaveAddress = useCallback(() => {
    if (!isMountedRef.current) {
      return
    }

    clearAutoSaveAddressTimeout()
    autoSaveAddressTimeoutRef.current = setTimeout(() => {
      autoSaveAddressTimeoutRef.current = null

      if (!isMountedRef.current) {
        return
      }

      void attemptAutoSaveAddressRef.current()
    }, 600)
  }, [attemptAutoSaveAddressRef, clearAutoSaveAddressTimeout])

  useEffect(() => {
    isMountedRef.current = true
    autoSaveAddressIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        return
      }

      void attemptAutoSaveAddressRef.current()
    }, 1_200)

    return () => {
      isMountedRef.current = false
      clearAutoSaveAddressInterval()
      clearAutoSaveAddressTimeout()
    }
  }, [
    attemptAutoSaveAddressRef,
    clearAutoSaveAddressInterval,
    clearAutoSaveAddressTimeout,
  ])

  return {
    clearAutoSaveAddressTimeout,
    scheduleAutoSaveAddress,
  }
}
