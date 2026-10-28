import { createClient } from '@spree/sdk'

import { withStorefrontChannelOwnership } from './channel-ownership'

export type StorefrontApiConfig = {
  baseUrl: string
  channel: string
  country?: string
  currency?: string
  locale?: string
  publishableKey: string
}

export function createSpreeStoreClient(config: StorefrontApiConfig) {
  return withStorefrontChannelOwnership(createClient(config), {
    cacheKey: [config.baseUrl, config.publishableKey, config.channel].join(
      '\n',
    ),
    channel: config.channel,
  })
}
