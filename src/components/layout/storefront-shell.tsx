import { useRouterState } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { isNewsletterPopupRouteExcluded } from '@/components/layout/newsletter-popup-eligibility'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'
import type { StorefrontBranding } from '@/lib/storefront/contracts'
import { useNewsletterPopupLifecycle } from '@/lib/newsletter/client/use-newsletter-popup-lifecycle'
import { StorefrontShellView } from '@/components/layout/storefront-shell-view'

const NewsletterPopup = lazy(async () => {
  const module = await import('@/components/layout/newsletter-popup')
  return { default: module.NewsletterPopup }
})

function hasOpenOverlay() {
  return Boolean(document.querySelector('[role="dialog"]'))
}

function DeferredNewsletterPopup() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isRouteEligible = !isNewsletterPopupRouteExcluded(pathname)
  const { onAccepted, onDismiss, shouldRender } = useNewsletterPopupLifecycle({
    enabled: isRouteEligible,
    hasOpenOverlay,
    pathname,
  })

  if (!shouldRender) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <NewsletterPopup onAccepted={onAccepted} onDismiss={onDismiss} />
    </Suspense>
  )
}

export function StorefrontShell({
  branding,
  capabilities,
  children,
}: {
  branding: StorefrontBranding
  capabilities: StorefrontShellCapabilities
  children: ReactNode
}) {
  return (
    <StorefrontShellView
      slots={{
        footer: <Footer branding={branding} />,
        header: <Header branding={branding} capabilities={capabilities} />,
        newsletterPopup: <DeferredNewsletterPopup />,
      }}
    >
      {children}
    </StorefrontShellView>
  )
}
