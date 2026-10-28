import { getProductListingPriceBuckets } from '@/lib/catalog/contracts'
import { formatMoney } from '@/components/shared/money-display'
import type { ProductListingPriceBucket } from '@/lib/catalog/contracts'
import type { ProductListingFilterChoiceDisplay } from './product-listing-filter-types'

export type ProductListingPriceBucketDisplay = ProductListingPriceBucket & {
  label: string
}

export function getProductListingPriceBucketDisplays({
  currencyCode,
  labels,
  locale,
  max,
  min,
}: {
  currencyCode: string
  labels: {
    plus: (value: string) => string
    range: (minimum: string, maximum: string) => string
    under: (value: string) => string
  }
  locale: string
  max: number
  min: number
}): ProductListingPriceBucketDisplay[] {
  const formatBucketAmount = (amount: number) =>
    formatMoney({ amount, currencyCode }, locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })

  return getProductListingPriceBuckets({ max, min }).map((bucket) => {
    if (bucket.min === undefined && bucket.max !== undefined) {
      return { ...bucket, label: labels.under(formatBucketAmount(bucket.max)) }
    }

    if (bucket.min !== undefined && bucket.max !== undefined) {
      return {
        ...bucket,
        label: labels.range(
          formatBucketAmount(bucket.min),
          formatBucketAmount(bucket.max),
        ),
      }
    }

    if (bucket.min !== undefined) {
      return { ...bucket, label: labels.plus(formatBucketAmount(bucket.min)) }
    }

    return { ...bucket, label: bucket.id }
  })
}

export function getProductListingPriceFilterChoiceDisplays({
  anyLabel,
  buckets,
  selectedBucketId,
}: {
  anyLabel: string
  buckets: readonly ProductListingPriceBucketDisplay[]
  selectedBucketId?: string
}): ProductListingFilterChoiceDisplay[] {
  return [
    {
      id: 'any-price',
      label: anyLabel,
      selected: selectedBucketId === undefined,
    },
    ...buckets.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      selected: bucket.id === selectedBucketId,
    })),
  ]
}
