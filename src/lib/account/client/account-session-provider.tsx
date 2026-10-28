import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { CustomerProfile } from '@/lib/account/contracts'

type AccountSessionContextValue = {
  customer: CustomerProfile
  redirectToLogin: () => void | Promise<void>
}

const AccountSessionContext = createContext<
  AccountSessionContextValue | undefined
>(undefined)

export function AccountSessionProvider({
  children,
  customer,
  onSessionRequired,
}: {
  children: ReactNode
  customer: CustomerProfile
  onSessionRequired: () => void | Promise<void>
}) {
  return (
    <AccountSessionContext.Provider
      value={{ customer, redirectToLogin: onSessionRequired }}
    >
      {children}
    </AccountSessionContext.Provider>
  )
}

export function useAccountSession() {
  const session = useAccountSessionContext()

  return session.customer
}

export function useAccountSessionRequiredRedirect() {
  return useAccountSessionContext().redirectToLogin
}

function useAccountSessionContext() {
  const session = useContext(AccountSessionContext)

  if (!session) {
    throw new Error(
      'Account session hooks must be used within AccountSessionProvider',
    )
  }

  return session
}
