import { useEffect, useRef, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { reportError } from '@/lib/observability/report-error'
import { cn } from '@/lib/utils'

type MarketSelectorProps = {
  className?: string
  variant?: 'footer' | 'menu'
}

type FooterModuleLoader<TProps> = () => Promise<{
  default: ComponentType<TProps>
}>

const loadMarketSelector: FooterModuleLoader<
  MarketSelectorProps
> = async () => {
  const module = await import('@/components/layout/market-selector')

  return { default: module.MarketSelector }
}

const loadNewsletterSignupForm: FooterModuleLoader<
  Record<string, never>
> = async () => {
  const module = await import('@/components/sections/newsletter-signup-form')

  return { default: module.NewsletterSignupForm }
}

const deferredSlotClass = 'min-h-5'

function useDeferredFooterModule() {
  const [shouldLoad, setShouldLoad] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const slot = slotRef.current

    if (!slot) {
      setShouldLoad(true)
      return
    }

    if (typeof window.IntersectionObserver !== 'function') {
      setShouldLoad(true)
      return
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '480px 0px' },
    )

    observer.observe(slot)

    return () => observer.disconnect()
  }, [])

  return { shouldLoad, slotRef }
}

function DeferredFooterModule<TProps>({
  fallback,
  load,
  moduleName,
  render,
  retryLabel,
  slotClassName,
}: {
  fallback: ReactNode
  load: FooterModuleLoader<TProps>
  moduleName: string
  render: (Component: ComponentType<TProps>) => ReactNode
  retryLabel: string
  slotClassName?: string
}) {
  const { shouldLoad, slotRef } = useDeferredFooterModule()
  const [Component, setComponent] = useState<ComponentType<TProps> | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!shouldLoad) {
      return
    }

    let cancelled = false
    setHasLoadError(false)

    void load().then(
      ({ default: LoadedComponent }) => {
        if (cancelled) {
          return
        }

        setComponent(() => LoadedComponent)
      },
      (error: unknown) => {
        if (cancelled) {
          return
        }

        reportError({
          context: `layout.${moduleName}`,
          error,
        })
        setHasLoadError(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [load, moduleName, retryCount, shouldLoad])

  function retry() {
    setComponent(null)
    setHasLoadError(false)
    setRetryCount((count) => count + 1)
  }

  return (
    <div className={slotClassName} ref={slotRef}>
      {hasLoadError ? (
        <div
          aria-live="polite"
          className="flex min-h-5 items-center"
          role="alert"
        >
          <button
            className="text-sm font-normal text-muted-foreground underline underline-offset-4 transition hover:text-foreground focus-visible:focus-ring"
            onClick={retry}
            type="button"
          >
            {retryLabel}
          </button>
        </div>
      ) : Component ? (
        render(Component)
      ) : (
        fallback
      )}
    </div>
  )
}

export function DeferredFooterMarketSelector({
  retryLabel,
  ...props
}: MarketSelectorProps & { retryLabel: string }) {
  return (
    <DeferredFooterModule
      fallback={<MarketSelectorFallback />}
      load={loadMarketSelector}
      moduleName="footer.marketSelector"
      render={(MarketSelector) => <MarketSelector {...props} />}
      retryLabel={retryLabel}
      slotClassName={deferredSlotClass}
    />
  )
}

export function DeferredFooterNewsletterSignup({
  retryLabel,
}: {
  retryLabel: string
}) {
  return (
    <DeferredFooterModule
      fallback={<NewsletterSignupFallback />}
      load={loadNewsletterSignupForm}
      moduleName="footer.newsletter"
      render={(NewsletterSignupForm) => <NewsletterSignupForm />}
      retryLabel={retryLabel}
    />
  )
}

function MarketSelectorFallback() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-5 w-24 animate-pulse bg-muted motion-reduce:animate-none',
        deferredSlotClass,
      )}
    />
  )
}

function NewsletterSignupFallback() {
  return (
    <div
      aria-hidden="true"
      className="mt-6 h-14 w-full animate-pulse border border-input bg-muted motion-reduce:animate-none"
    />
  )
}
