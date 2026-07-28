import type {
  ProductListingAvailability,
  ProductListingOptionFilter,
} from '@/lib/catalog/model/product-listing'
import { formatNumber } from '@/lib/i18n/messages'
import { formatMoney } from '@/lib/money/format-money'

export type PriceBucket = {
  id: string
  label: string
  min?: number
  max?: number
}

const PRICE_THRESHOLDS = [50, 100, 200]

export function formatOptionLabel(option: {
  id: string
  label: string
  name: string
}) {
  return option.label || option.name || option.id
}

export function formatProductCount({
  count,
  locale,
  productPlural,
  productSingular,
}: {
  count: number
  locale: string
  productPlural: string
  productSingular: string
}) {
  const formattedCount = formatNumber(count, locale)

  return `${formattedCount} ${count === 1 ? productSingular : productPlural}`
}

function formatPriceBucketMoney(
  amount: number,
  currencyCode: string,
  locale: string,
) {
  return formatMoney({ amount, currencyCode }, locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
}

export function generatePriceBuckets({
  currency,
  locale,
  max,
  min,
}: {
  currency: string
  locale: string
  max: number
  min: number
}): PriceBucket[] {
  const buckets: PriceBucket[] = []

  if (min < PRICE_THRESHOLDS[0]) {
    buckets.push({
      id: `under-${PRICE_THRESHOLDS[0]}`,
      label: `Under ${formatPriceBucketMoney(PRICE_THRESHOLDS[0], currency, locale)}`,
      max: PRICE_THRESHOLDS[0],
    })
  }

  for (let index = 0; index < PRICE_THRESHOLDS.length - 1; index++) {
    const bucketMin = PRICE_THRESHOLDS[index]
    const bucketMax = PRICE_THRESHOLDS[index + 1]

    if (max > bucketMin && min < bucketMax) {
      buckets.push({
        id: `${bucketMin}-${bucketMax}`,
        label: `${formatPriceBucketMoney(bucketMin, currency, locale)} - ${formatPriceBucketMoney(bucketMax, currency, locale)}`,
        min: bucketMin,
        max: bucketMax,
      })
    }
  }

  const lastThreshold = PRICE_THRESHOLDS[PRICE_THRESHOLDS.length - 1]

  if (max > lastThreshold) {
    buckets.push({
      id: `${lastThreshold}-plus`,
      label: `${formatPriceBucketMoney(lastThreshold, currency, locale)}+`,
      min: lastThreshold,
    })
  }

  return buckets
}

export function findMatchingBucket(
  buckets: PriceBucket[],
  priceMin?: number,
  priceMax?: number,
) {
  return buckets.find(
    (bucket) =>
      (bucket.min === undefined
        ? priceMin === undefined
        : bucket.min === priceMin) &&
      (bucket.max === undefined
        ? priceMax === undefined
        : bucket.max === priceMax),
  )
}

export function getFilterSelectionCount(
  filter: ProductListingOptionFilter,
  selectedOptionIds: string[],
) {
  return filter.options.filter((option) =>
    selectedOptionIds.includes(option.id),
  ).length
}

export function getAvailabilityLabel(
  availability: ProductListingAvailability,
  labels: {
    inStock: string
    outOfStock: string
  },
) {
  return availability === 'in_stock' ? labels.inStock : labels.outOfStock
}
