import type { StorefrontApiConfig } from '@/lib/runtime/spree-client'
import type { ServerEnv } from '@/lib/env/env.server'
import { toSpreeLocaleCode } from '@/lib/runtime/locale-code'

export type SpreeClientMarket = {
  country?: string
  currencyCode?: string
  locale?: string
}

export function getSpreeStoreClientConfig({
  env,
  market,
}: {
  env: ServerEnv
  market?: SpreeClientMarket
}): StorefrontApiConfig {
  return {
    baseUrl: env.spreeApiUrl,
    channel: env.spreeChannel,
    country: market?.country?.toUpperCase(),
    currency: market?.currencyCode,
    locale: market?.locale ? toSpreeLocaleCode(market.locale) : undefined,
    publishableKey: env.spreePublishableKey,
  }
}
