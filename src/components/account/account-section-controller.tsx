import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { logoutCustomer } from '@/lib/account/api/customer-session.functions'
import type { CustomerProfile } from '@/lib/account/model/customer'

export type AccountSection =
  | 'addresses'
  | 'giftCards'
  | 'orders'
  | 'paymentMethods'
  | 'profile'

export type AccountSectionControllerValue = {
  account: {
    displayName: string
    email: string
  }
  session: {
    error: string | null
    isSigningOut: boolean
    signOut: () => Promise<void>
  }
}

export function AccountSectionController({
  children,
  customer,
}: {
  children: (controller: AccountSectionControllerValue) => ReactNode
  customer: CustomerProfile
}) {
  const { market, t } = useMarket()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const displayName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    t('account.myAccount')

  async function signOut() {
    setIsSigningOut(true)
    setSignOutError(null)

    try {
      await logoutCustomer()
      await router.invalidate()
      await router.navigate({
        href: `/${market.country}/${market.locale}/account/login`,
      })
    } catch {
      setSignOutError(t('account.signOutFailed'))
    } finally {
      setIsSigningOut(false)
    }
  }

  return children({
    account: {
      displayName,
      email: customer.email,
    },
    session: {
      error: signOutError,
      isSigningOut,
      signOut,
    },
  })
}
