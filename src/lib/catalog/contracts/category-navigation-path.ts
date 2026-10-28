import type { CategoryNavigationItem } from './category'

function getCategoryPath({
  category,
  country,
  locale,
}: {
  category: CategoryNavigationItem
  country: string
  locale: string
}) {
  return `/${country}/${locale}/collections/${category.permalink}`
}

function getDecodedPathname(pathname: string) {
  return decodeURIComponent(pathname)
}

export function categoryPathMatches({
  category,
  country,
  locale,
  pathname,
}: {
  category: CategoryNavigationItem
  country: string
  locale: string
  pathname: string
}) {
  const decodedPathname = getDecodedPathname(pathname)
  const categoryPath = getCategoryPath({ category, country, locale })

  return (
    decodedPathname === categoryPath ||
    decodedPathname.startsWith(`${categoryPath}/`)
  )
}

export function categoryPathEquals({
  category,
  country,
  locale,
  pathname,
}: {
  category: CategoryNavigationItem
  country: string
  locale: string
  pathname: string
}) {
  return (
    getDecodedPathname(pathname) ===
    getCategoryPath({ category, country, locale })
  )
}
