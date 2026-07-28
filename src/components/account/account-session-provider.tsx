import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { CustomerProfile } from '@/lib/account/model/customer'

const AccountSessionContext = createContext<CustomerProfile | undefined>(
  undefined,
)

export function AccountSessionProvider({
  children,
  customer,
}: {
  children: ReactNode
  customer: CustomerProfile
}) {
  return (
    <AccountSessionContext.Provider value={customer}>
      {children}
    </AccountSessionContext.Provider>
  )
}

export function useAccountSession() {
  const customer = useContext(AccountSessionContext)

  if (!customer) {
    throw new Error(
      'useAccountSession must be used within AccountSessionProvider',
    )
  }

  return customer
}
