import type { MarketSelectionInput } from '@/lib/core/market'

import { loginCustomer } from '../api/login.functions'
import type { CustomerLoginInput } from '../validation/login'
import { useCustomerAuthMutation } from './use-customer-auth-mutation'

export function useCustomerLogin({
  market,
  onLoggedIn,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onLoggedIn?: () => void | Promise<void>
}) {
  return useCustomerAuthMutation({
    market,
    mutationFn: (data: CustomerLoginInput) =>
      loginCustomer({ data: { ...data, market } }),
    onAuthenticated: onLoggedIn,
    operation: 'login',
  })
}
