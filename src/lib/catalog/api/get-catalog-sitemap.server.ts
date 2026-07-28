import '@tanstack/react-start/server-only'

import type { Client } from '@spree/sdk'

import {
  isSyntheticCatalogRootCategory,
  mapSpreeCategoryToSummary,
} from '@/lib/catalog/mappers/category.mapper'
import type { CategorySummary } from '@/lib/catalog/model/category'
import type { ProductSummary } from '@/lib/catalog/model/product'
import { mapSpreeMarketsToStorefrontMarkets } from '@/lib/market/mappers/market.mapper'
import type { StorefrontMarket } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'
import {
  getServerSpreeClient,
  getServerSpreeClientForMarket,
} from '@/lib/spree/client.server'

import { getProductListing } from './get-product-summaries'

const SITEMAP_PAGE_SIZE = 100
const MAX_CATALOG_PAGES = 500
const MAX_PARALLEL_MARKET_REQUESTS = 3

type SitemapMarketContext = {
  countries: string[]
  country: string
  currencyCode: string
  locale: string
}

function getSitemapMarketContexts(markets: StorefrontMarket[]) {
  const contexts: SitemapMarketContext[] = []

  for (const market of markets) {
    const countries = market.countries.map((country) => country.country)
    const country = countries[0]

    if (!country) {
      continue
    }

    const locales = market.locales.length
      ? market.locales.map((locale) => locale.code)
      : [market.defaultLocale]

    for (const locale of locales) {
      contexts.push({
        countries,
        country,
        currencyCode: market.currencyCode,
        locale,
      })
    }
  }

  return contexts
}

async function getAllProductSummaries(client: Client) {
  const products: ProductSummary[] = []
  let page = 1
  let pages = 1

  do {
    const listing = await getProductListing(client, {
      limit: SITEMAP_PAGE_SIZE,
      page,
    })

    products.push(...listing.products)
    pages = listing.meta.pages
    page += 1
  } while (page <= pages && page <= MAX_CATALOG_PAGES)

  return products
}

async function getAllCategorySummaries(client: Client) {
  const categories: CategorySummary[] = []
  let page = 1
  let pages = 1

  do {
    const response = await client.categories.list({
      limit: SITEMAP_PAGE_SIZE,
      page,
    })

    categories.push(
      ...response.data
        .filter((category) => !isSyntheticCatalogRootCategory(category))
        .map(mapSpreeCategoryToSummary),
    )
    pages = response.meta.pages
    page += 1
  } while (page <= pages && page <= MAX_CATALOG_PAGES)

  return categories
}

function reportSitemapResourceError({
  error,
  resource,
  context,
}: {
  error: unknown
  resource: 'categories' | 'products'
  context: SitemapMarketContext
}) {
  reportError({
    context: `sitemap.${context.country}.${context.locale}.${resource}`,
    error,
  })
}

async function getMarketCatalog(context: SitemapMarketContext) {
  const client = getServerSpreeClientForMarket(context)
  const [productsResult, categoriesResult] = await Promise.allSettled([
    getAllProductSummaries(client),
    getAllCategorySummaries(client),
  ])

  if (productsResult.status === 'rejected') {
    reportSitemapResourceError({
      error: productsResult.reason,
      resource: 'products',
      context,
    })
  }

  if (categoriesResult.status === 'rejected') {
    reportSitemapResourceError({
      error: categoriesResult.reason,
      resource: 'categories',
      context,
    })
  }

  const catalog = {
    categories:
      categoriesResult.status === 'fulfilled'
        ? categoriesResult.value.map((category) => ({
            permalink: category.permalink,
          }))
        : [],
    locale: context.locale,
    products:
      productsResult.status === 'fulfilled'
        ? productsResult.value.map((product) => ({
            imageUrl: product.image?.src ?? null,
            slug: product.slug,
          }))
        : [],
  }

  return context.countries.map((country) => ({
    ...catalog,
    country,
  }))
}

async function getMarketCatalogs(contexts: SitemapMarketContext[]) {
  const catalogs = []

  for (
    let index = 0;
    index < contexts.length;
    index += MAX_PARALLEL_MARKET_REQUESTS
  ) {
    const batch = contexts.slice(index, index + MAX_PARALLEL_MARKET_REQUESTS)
    const batchCatalogs = await Promise.all(batch.map(getMarketCatalog))

    catalogs.push(...batchCatalogs.flat())
  }

  return catalogs
}

export async function getCatalogSitemapData() {
  const marketResponse = await getServerSpreeClient().markets.list()
  const markets = mapSpreeMarketsToStorefrontMarkets(marketResponse.data, 'en')
  const contexts = getSitemapMarketContexts(markets)

  if (contexts.length === 0) {
    throw new Error('No indexable storefront markets are available')
  }

  return getMarketCatalogs(contexts)
}
