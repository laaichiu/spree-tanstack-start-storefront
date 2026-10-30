import { getMessage } from '@/lib/i18n/messages'
import type { MessageDictionary } from '@/lib/i18n/messages'
import { normalizeLocale } from '@/lib/core/market'

import { mapStorefrontBranding } from '../mappers/storefront-branding.mapper'
import type { StorefrontBranding } from '@/lib/storefront/contracts'

export function getConfiguredStorefrontBranding(
  locale: string,
  messages: MessageDictionary,
): StorefrontBranding {
  const normalizedLocale = normalizeLocale(locale)

  return mapStorefrontBranding({
    locale: normalizedLocale,
    logoUrl: null,
    metaDescription: getMessage(messages, 'branding.defaultDescription'),
    name: getMessage(messages, 'branding.defaultName'),
    seoTitle: null,
  })
}
