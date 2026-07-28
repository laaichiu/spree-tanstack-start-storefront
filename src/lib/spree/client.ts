import { createClient } from '@spree/sdk'

import type { SpreeStoreClientConfig } from './config'

export function createSpreeStoreClient({
  baseUrl,
  country,
  currency,
  locale,
  publishableKey,
}: SpreeStoreClientConfig) {
  return createClient({
    baseUrl,
    country,
    currency,
    locale,
    publishableKey,
  })
}
