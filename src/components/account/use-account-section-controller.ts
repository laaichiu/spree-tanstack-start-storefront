import { useRouter } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { getCustomerDisplayName } from '@/components/account/account-profile-display'
import type { AccountSection, CustomerProfile } from '@/lib/account/contracts'
import { useCustomerSignOutController } from '@/lib/account/client/use-customer-sign-out-controller'

export function useAccountSectionController({
  activeSection,
  customer,
}: {
  activeSection: AccountSection
  customer: CustomerProfile
}) {
  const { market, t } = useMarket()
  const router = useRouter()
  const session = useCustomerSignOutController({
    errorMessage: t('account.signOutFailed'),
    market: { country: market.country, locale: market.locale },
    onSignedOut: async () => {
      await router.invalidate()
      await router.navigate({
        params: { country: market.country, locale: market.locale },
        to: '/$country/$locale/account/login',
      })
    },
  })

  return {
    page: {
      account: {
        displayName: getCustomerDisplayName(customer) ?? t('account.myAccount'),
        email: customer.email,
      },
      activeSection,
    },
    session,
  }
}
