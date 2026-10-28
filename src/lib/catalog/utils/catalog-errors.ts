import { isSpreeErrorStatus } from '@/lib/spree/errors'

export function isCatalogResourceNotFoundError(error: unknown) {
  return isSpreeErrorStatus(error, [404])
}
