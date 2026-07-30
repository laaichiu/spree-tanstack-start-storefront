import { useRouterState } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { isNewsletterPopupDismissed } from '@/components/layout/newsletter-popup-dismissal'
import { isNewsletterPopupRouteExcluded } from '@/components/layout/newsletter-popup-eligibility'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'

const NewsletterPopup = lazy(async () => {
  const module = await import('@/components/layout/newsletter-popup')
  return { default: module.NewsletterPopup }
})

export const NEWSLETTER_POPUP_DEFER_MS = 15_000

function DeferredNewsletterPopup() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [shouldMount, setShouldMount] = useState(false)
  const [acceptedPathname, setAcceptedPathname] = useState<string | null>(null)
  const isRouteEligible = !isNewsletterPopupRouteExcluded(pathname)
  const unmountNewsletterPopup = useCallback(() => setShouldMount(false), [])
  const recordNewsletterAcceptance = useCallback(
    () => setAcceptedPathname(pathname),
    [pathname],
  )

  useEffect(() => {
    if (!isRouteEligible || shouldMount || isNewsletterPopupDismissed()) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (!isNewsletterPopupDismissed()) {
        setShouldMount(true)
      }
    }, NEWSLETTER_POPUP_DEFER_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isRouteEligible, shouldMount])

  const canShowAcceptedState =
    acceptedPathname === null || acceptedPathname === pathname

  return isRouteEligible && shouldMount && canShowAcceptedState ? (
    <Suspense fallback={null}>
      <NewsletterPopup
        onAccepted={recordNewsletterAcceptance}
        onDismiss={unmountNewsletterPopup}
      />
    </Suspense>
  ) : null
}

export function StorefrontShell({
  capabilities,
  children,
}: {
  capabilities: StorefrontShellCapabilities
  children: ReactNode
}) {
  return (
    <>
      <Header capabilities={capabilities} />
      <main>{children}</main>
      <Footer />
      <DeferredNewsletterPopup />
    </>
  )
}
