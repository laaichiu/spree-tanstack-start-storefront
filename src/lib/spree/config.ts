import type { ServerEnv } from '@/lib/env/env.server'

export type SpreeStoreClientConfig = {
  baseUrl: string
  country?: string
  currency?: string
  locale?: string
  publishableKey: string
}

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
}): SpreeStoreClientConfig {
  return {
    baseUrl: env.spreeApiUrl,
    country: market?.country?.toUpperCase(),
    currency: market?.currencyCode,
    locale: market?.locale,
    publishableKey: env.spreePublishableKey,
  }
}
