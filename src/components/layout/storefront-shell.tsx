import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { isNewsletterPopupRouteExcluded } from '@/components/layout/newsletter-popup-eligibility'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'

const NewsletterPopup = lazy(async () => {
  const module = await import('@/components/layout/newsletter-popup')
  return { default: module.NewsletterPopup }
})

function DeferredNewsletterPopup() {
  const [pathname, setPathname] = useState<string | null>(null)
  const [isEligible, setIsEligible] = useState(false)

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  useEffect(() => {
    if (!pathname || isNewsletterPopupRouteExcluded(pathname)) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsEligible(true)
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [pathname])

  return isEligible ? (
    <Suspense fallback={null}>
      <NewsletterPopup />
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
