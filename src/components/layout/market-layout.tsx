import type { ReactNode } from 'react'

import { CheckoutLayoutShell } from '@/components/layout/checkout-layout-shell'
import { MarketProvider } from '@/components/layout/market-provider'
import { StorefrontShell } from '@/components/layout/storefront-shell'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'
import type { MessageDictionary } from '@/lib/i18n/messages'
import type {
  ResolvedMarket,
  StorefrontMarket,
} from '@/lib/market/model/market'

export function MarketLayout({
  capabilities,
  children,
  isCheckout,
  market,
  marketOptions,
  messages,
}: {
  capabilities: StorefrontShellCapabilities
  children: ReactNode
  isCheckout: boolean
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  messages: MessageDictionary
}) {
  return (
    <MarketProvider
      market={market}
      marketOptions={marketOptions}
      messages={messages}
    >
      {isCheckout ? (
        <CheckoutLayoutShell>{children}</CheckoutLayoutShell>
      ) : (
        <StorefrontShell capabilities={capabilities}>
          {children}
        </StorefrontShell>
      )}
    </MarketProvider>
  )
}
