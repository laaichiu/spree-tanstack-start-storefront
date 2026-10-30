function normalizeSeoText(
  value: string | null | undefined,
  maxLength?: number,
) {
  const normalized = value
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return null
  }

  return maxLength && normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
    : normalized
}

export function buildPageTitle(pageTitle: string, storeName: string) {
  const title = normalizeSeoText(pageTitle)
  const name = normalizeSeoText(storeName)

  if (!title) {
    return name ?? 'Store'
  }

  if (!name) {
    return title
  }

  const normalizedTitle = title.toLocaleLowerCase()
  const normalizedName = name.toLocaleLowerCase()

  if (normalizedTitle === normalizedName) {
    return title
  }

  return `${title} | ${name}`
}

export function resolveSeoDescription({
  fallbackDescription,
  pageDescription,
  storeDescription,
}: {
  fallbackDescription?: string | null
  pageDescription?: string | null
  storeDescription?: string | null
}) {
  return (
    [pageDescription, storeDescription, fallbackDescription]
      .map((value) => normalizeSeoText(value, 160))
      .find((value): value is string => Boolean(value)) ?? 'Store'
  )
}
