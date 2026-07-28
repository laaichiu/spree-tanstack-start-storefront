import '@tanstack/react-start/server-only'

import type { ServerEnv } from '@/lib/env/env.server'
import { readServerEnv } from '@/lib/env/env.server'

import { createSpreeStoreClient } from './client'
import type { SpreeClientMarket } from './config'
import { getSpreeStoreClientConfig } from './config'

export function createServerSpreeClient(
  env: ServerEnv,
  market?: SpreeClientMarket,
) {
  return createSpreeStoreClient(getSpreeStoreClientConfig({ env, market }))
}

export function getServerSpreeClient() {
  return createServerSpreeClient(readServerEnv(process.env))
}

export function getServerSpreeClientForMarket(market: SpreeClientMarket) {
  return createServerSpreeClient(readServerEnv(process.env), market)
}
