export type AccountRedirectLocation = {
  hash?: string
  pathname: string
  searchStr?: string
}

export type AccountRedirectParams = {
  country: string
  locale: string
}

export function buildAccountRedirectTarget(location: AccountRedirectLocation) {
  return `${location.pathname}${location.searchStr ?? ''}${location.hash ?? ''}`
}

export function getAccountLoginRedirectHref(
  params: AccountRedirectParams,
  location: AccountRedirectLocation,
) {
  const search = new URLSearchParams({
    redirect: buildAccountRedirectTarget(location),
  })

  return `/${params.country}/${params.locale}/account/login?${search.toString()}`
}
