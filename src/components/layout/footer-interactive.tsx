import type { ComponentType, ReactNode } from 'react'

import { useDeferredModule } from '@/lib/storefront/client/use-deferred-module'
import type { DeferredModuleLoader } from '@/lib/storefront/client/use-deferred-module'

import {
  FooterDeferredSlotView,
  FooterMarketSelectorFallbackView,
  FooterNewsletterSignupFallbackView,
} from '@/components/layout/footer-deferred-slot-view'

type MarketSelectorProps = {
  className?: string
  variant?: 'footer' | 'menu'
}

const loadMarketSelector: DeferredModuleLoader<
  MarketSelectorProps
> = async () => {
  const module = await import('@/components/layout/market-selector')

  return { default: module.MarketSelector }
}

const loadNewsletterSignup: DeferredModuleLoader<
  Record<string, never>
> = async () => {
  const module = await import('@/components/newsletter/newsletter-signup')

  return { default: module.NewsletterSignup }
}

function DeferredFooterModule<TProps>({
  fallback,
  load,
  moduleName,
  render,
  retryLabel,
}: {
  fallback: ReactNode
  load: DeferredModuleLoader<TProps>
  moduleName: string
  render: (Component: ComponentType<TProps>) => ReactNode
  retryLabel: string
}) {
  const { Component, hasLoadError, retry, slotRef } = useDeferredModule({
    load,
    moduleName,
  })

  return (
    <FooterDeferredSlotView
      model={{ hasLoadError, retryLabel }}
      onRetry={retry}
      slotRef={slotRef}
      slots={{
        content: Component && render(Component),
        fallback,
      }}
    />
  )
}

export function DeferredFooterMarketSelector({
  retryLabel,
  ...props
}: MarketSelectorProps & { retryLabel: string }) {
  return (
    <DeferredFooterModule
      fallback={<FooterMarketSelectorFallbackView />}
      load={loadMarketSelector}
      moduleName="footer.marketSelector"
      render={(MarketSelector) => <MarketSelector {...props} />}
      retryLabel={retryLabel}
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
      fallback={<FooterNewsletterSignupFallbackView />}
      load={loadNewsletterSignup}
      moduleName="footer.newsletter"
      render={(NewsletterSignup) => <NewsletterSignup />}
      retryLabel={retryLabel}
    />
  )
}
