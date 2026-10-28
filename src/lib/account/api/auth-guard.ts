import { redirect } from '@tanstack/react-router'

import { getCurrentCustomer } from './customer-session.functions'
import { getAccountLoginRedirectHref } from '../utils/account-login-redirect'
import type {
  AccountRedirectLocation,
  AccountRedirectParams,
} from '../utils/account-login-redirect'

export { getAccountLoginRedirectHref } from '../utils/account-login-redirect'

type AccountAuthLocation = AccountRedirectLocation
type AccountAuthParams = AccountRedirectParams

export function redirectToAccountLogin(
  params: AccountAuthParams,
  location: AccountAuthLocation,
): never {
  throw redirect({
    href: getAccountLoginRedirectHref(params, location),
    replace: true,
  })
}

export async function requireAuthenticatedCustomer({
  location,
  params,
}: {
  location: AccountAuthLocation
  params: AccountAuthParams
}) {
  const customer = await getCurrentCustomer({
    data: {
      country: params.country,
      locale: params.locale,
    },
  })

  if (customer) {
    return customer
  }

  throw redirect({
    href: getAccountLoginRedirectHref(params, location),
    replace: true,
  })
}
