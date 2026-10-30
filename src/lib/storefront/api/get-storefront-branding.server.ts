import '@tanstack/react-start/server-only'

import { toSpreeLocaleCode } from '@/lib/runtime/locale-code'
import { getServerSpreeClient } from '@/lib/spree/client.server'
import { reportError } from '@/lib/observability/report-error'
import { loadMessages } from '@/lib/i18n/messages'

import { getConfiguredStorefrontBranding } from '../config/storefront-branding'
import { mapStorefrontBranding } from '../mappers/storefront-branding.mapper'
import type { StorefrontBranding } from '@/lib/storefront/contracts'

export type StorefrontBrandingRequest = {
  locale: string
}

type StoreMetadataResponse = {
  id: string
  meta_description: string | null
  name: string
  seo_title: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readStoreMetadataResponse(value: unknown): StoreMetadataResponse {
  if (!isRecord(value)) {
    throw new Error('Store metadata response must be an object')
  }

  if (
    !Object.hasOwn(value, 'id') ||
    !Object.hasOwn(value, 'name') ||
    !Object.hasOwn(value, 'meta_description') ||
    !Object.hasOwn(value, 'seo_title')
  ) {
    throw new Error('Store metadata response has invalid fields')
  }

  const { id, meta_description, name, seo_title } = value

  if (
    typeof id !== 'string' ||
    !id.startsWith('store_') ||
    id.length === 'store_'.length ||
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    (meta_description !== null && typeof meta_description !== 'string') ||
    (seo_title !== null && typeof seo_title !== 'string')
  ) {
    throw new Error('Store metadata response has invalid fields')
  }

  return { id, meta_description, name, seo_title }
}

async function getStorefrontBrandingFromApi(
  locale: string,
): Promise<StorefrontBranding> {
  const response = await getServerSpreeClient().store.get({
    locale: toSpreeLocaleCode(locale),
  })
  const metadata = readStoreMetadataResponse(response)

  return mapStorefrontBranding({
    locale,
    logoUrl: null,
    metaDescription: metadata.meta_description,
    name: metadata.name,
    seoTitle: metadata.seo_title,
  })
}

export async function getStorefrontBrandingForRequest({
  locale,
}: StorefrontBrandingRequest): Promise<StorefrontBranding> {
  try {
    return await getStorefrontBrandingFromApi(locale)
  } catch (error: unknown) {
    reportError({
      context: 'layout.storefrontBranding',
      error,
    })

    // Keep localized generic branding available if Store metadata cannot load.
    return getConfiguredStorefrontBranding(locale, await loadMessages(locale))
  }
}
