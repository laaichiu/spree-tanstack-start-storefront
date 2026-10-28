import type { MarketSelectionInput } from '@/lib/core/market'

import { registerCustomer } from '../api/account.functions'
import type { CustomerRegisterInput } from '../validation/register'
import { useCustomerAuthMutation } from './use-customer-auth-mutation'

export function useCustomerRegistration({
  market,
  onRegistered,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onRegistered?: () => void | Promise<void>
}) {
  return useCustomerAuthMutation({
    market,
    mutationFn: (data: CustomerRegisterInput) =>
      registerCustomer({ data: { ...data, market } }),
    onAuthenticated: onRegistered,
    operation: 'register',
  })
}
