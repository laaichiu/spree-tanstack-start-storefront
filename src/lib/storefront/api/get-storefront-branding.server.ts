import '@tanstack/react-start/server-only'

import { getServerSpreeClient } from '@/lib/spree/client.server'

import { getConfiguredStorefrontBranding } from '../config/storefront-branding'
import { mapStorefrontBranding } from '../mappers/storefront-branding.mapper'
import type { StorefrontBranding } from '@/lib/storefront/contracts'

export type StorefrontBrandingRequest = {
  locale: string
}

type StoreMetadataResponse = {
  locale: string
  logo_url: string | null
  meta_description: string | null
  name: string
  seo_title: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStoreMetadataResponse(value: unknown): StoreMetadataResponse {
  if (!isRecord(value)) {
    throw new Error('Store metadata response must be an object')
  }

  const { locale, logo_url, meta_description, name, seo_title } = value

  if (
    typeof locale !== 'string' ||
    typeof name !== 'string' ||
    (logo_url !== null && typeof logo_url !== 'string') ||
    (meta_description !== null && typeof meta_description !== 'string') ||
    (seo_title !== null && typeof seo_title !== 'string')
  ) {
    throw new Error('Store metadata response has invalid fields')
  }

  return { locale, logo_url, meta_description, name, seo_title }
}

async function getStorefrontBrandingFromApi(
  locale: string,
): Promise<StorefrontBranding> {
  const response = await getServerSpreeClient().request<unknown>('GET', '/', {
    locale,
  })
  const metadata = readStoreMetadataResponse(response)

  return mapStorefrontBranding({
    locale: metadata.locale || locale,
    logoUrl: metadata.logo_url,
    metaDescription: metadata.meta_description,
    name: metadata.name,
    seoTitle: metadata.seo_title,
  })
}

export async function getStorefrontBrandingForRequest({
  locale,
}: StorefrontBrandingRequest): Promise<StorefrontBranding> {
  const fallback = getConfiguredStorefrontBranding(locale)

  try {
    return await getStorefrontBrandingFromApi(locale)
  } catch {
    // The public Store metadata endpoint is newer than the currently pinned
    // backend/SDK. Keep startup branding available while it is being rolled
    // out; all successful responses still pass through the normalized mapper.
    return fallback
  }
}
