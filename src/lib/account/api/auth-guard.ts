import { redirect } from '@tanstack/react-router'

import { getCurrentCustomer } from './customer-session.functions'

type AccountAuthLocation = {
  hash?: string
  pathname: string
  searchStr?: string
}

type AccountAuthParams = {
  country: string
  locale: string
}

export function buildAccountRedirectTarget(location: AccountAuthLocation) {
  return `${location.pathname}${location.searchStr ?? ''}${location.hash ?? ''}`
}

export function getAccountLoginRedirectHref(
  params: AccountAuthParams,
  location: AccountAuthLocation,
) {
  const search = new URLSearchParams({
    redirect: buildAccountRedirectTarget(location),
  })

  return `/${params.country}/${params.locale}/account/login?${search.toString()}`
}

export async function requireAuthenticatedCustomer({
  location,
  params,
}: {
  location: AccountAuthLocation
  params: AccountAuthParams
}) {
  const customer = await getCurrentCustomer()

  if (customer) {
    return customer
  }

  throw redirect({
    href: getAccountLoginRedirectHref(params, location),
    replace: true,
  })
}
