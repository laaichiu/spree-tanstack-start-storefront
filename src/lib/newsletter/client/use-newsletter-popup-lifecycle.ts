import { useCallback, useEffect, useState } from 'react'

import {
  isNewsletterPopupDismissed,
  markNewsletterPopupDismissed,
} from '../utils/popup-dismissal'

export const NEWSLETTER_POPUP_DEFER_MS = 15_000
export const NEWSLETTER_POPUP_RETRY_MS = 1_000

export function useNewsletterPopupLifecycle({
  deferMs = NEWSLETTER_POPUP_DEFER_MS,
  enabled,
  hasOpenOverlay,
  pathname,
  retryMs = NEWSLETTER_POPUP_RETRY_MS,
}: {
  deferMs?: number
  enabled: boolean
  hasOpenOverlay: () => boolean
  pathname: string
  retryMs?: number
}) {
  const [shouldMount, setShouldMount] = useState(false)
  const [acceptedPathname, setAcceptedPathname] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || shouldMount || isNewsletterPopupDismissed()) {
      return
    }

    let timeoutId: number

    function schedulePopup(delay: number) {
      timeoutId = window.setTimeout(() => {
        if (isNewsletterPopupDismissed()) {
          return
        }

        if (hasOpenOverlay()) {
          schedulePopup(retryMs)
          return
        }

        setShouldMount(true)
      }, delay)
    }

    schedulePopup(deferMs)

    return () => window.clearTimeout(timeoutId)
  }, [deferMs, enabled, hasOpenOverlay, retryMs, shouldMount])

  const onAccepted = useCallback(() => {
    markNewsletterPopupDismissed()
    setAcceptedPathname(pathname)
  }, [pathname])
  const onDismiss = useCallback(() => {
    markNewsletterPopupDismissed()
    setShouldMount(false)
  }, [])
  const canShowAcceptedState =
    acceptedPathname === null || acceptedPathname === pathname

  return {
    onAccepted,
    onDismiss,
    shouldRender: enabled && shouldMount && canShowAcceptedState,
  }
}
