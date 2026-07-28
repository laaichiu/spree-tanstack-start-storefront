import type { CategoryNavigationItem } from '@/lib/catalog/model/category'

export const MENU_CLOSE_DELAY_MS = 140

export const topLevelClass =
  'link-underline-sweep text-sm leading-4 font-normal uppercase inline-flex h-12 items-center whitespace-nowrap after:bottom-[0.6rem] focus-visible:focus-ring'

export const panelLinkClass =
  'link-underline-sweep block w-fit max-w-full text-sm font-normal tracking-wider text-foreground uppercase after:bottom-0 focus-visible:focus-ring'

export function isSaleCategory(name: string) {
  return name.trim().toLowerCase().includes('sale')
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
  const decodedPathname = decodeURIComponent(pathname)
  const categoryPath = `/${country}/${locale}/collections/${category.permalink}`

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
  const decodedPathname = decodeURIComponent(pathname)
  const categoryPath = `/${country}/${locale}/collections/${category.permalink}`

  return decodedPathname === categoryPath
}
