export type ProductListingPriceBucket = {
  id: string
  min?: number
  max?: number
}

const PRODUCT_LISTING_PRICE_THRESHOLDS = [50, 100, 200] as const

export function getProductListingPriceBuckets({
  max,
  min,
}: {
  max: number
  min: number
}): ProductListingPriceBucket[] {
  const buckets: ProductListingPriceBucket[] = []
  const firstThreshold = PRODUCT_LISTING_PRICE_THRESHOLDS[0]

  if (min < firstThreshold) {
    buckets.push({ id: `under-${firstThreshold}`, max: firstThreshold })
  }

  for (
    let index = 0;
    index < PRODUCT_LISTING_PRICE_THRESHOLDS.length - 1;
    index++
  ) {
    const bucketMin = PRODUCT_LISTING_PRICE_THRESHOLDS[index]
    const bucketMax = PRODUCT_LISTING_PRICE_THRESHOLDS[index + 1]

    if (max > bucketMin && min < bucketMax) {
      buckets.push({
        id: `${bucketMin}-${bucketMax}`,
        min: bucketMin,
        max: bucketMax,
      })
    }
  }

  const lastThreshold =
    PRODUCT_LISTING_PRICE_THRESHOLDS[
      PRODUCT_LISTING_PRICE_THRESHOLDS.length - 1
    ]

  if (max > lastThreshold) {
    buckets.push({ id: `${lastThreshold}-plus`, min: lastThreshold })
  }

  return buckets
}

export function findMatchingProductListingPriceBucket<
  TBucket extends ProductListingPriceBucket,
>(
  buckets: readonly TBucket[],
  priceMin?: number,
  priceMax?: number,
): TBucket | undefined {
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
