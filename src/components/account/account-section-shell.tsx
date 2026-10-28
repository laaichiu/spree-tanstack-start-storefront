import type { ReactNode } from 'react'

import { useAccountSectionController } from '@/components/account/use-account-section-controller'
import type { AccountSection } from '@/lib/account/contracts'
import { useAccountSession } from '@/lib/account/client/account-session-provider'
import { useMarket } from '@/components/layout/market-provider'
import { AccountSectionHeaderView } from '@/components/account/account-section-header-view'
import { AccountSessionErrorView } from '@/components/account/account-session-error-view'
import { AccountSectionPageView } from '@/components/account/account-section-page-view'

export function AccountSectionShell({
  activeSection,
  children,
  showHeader = true,
}: {
  activeSection: AccountSection
  children: ReactNode
  showHeader?: boolean
}) {
  const customer = useAccountSession()
  const { t } = useMarket()
  const { page, session } = useAccountSectionController({
    activeSection,
    customer,
  })

  return (
    <AccountSectionPageView
      activeSection={page.activeSection}
      header={
        showHeader && (
          <AccountSectionHeaderView
            model={{
              email: page.account.email,
              isSigningOut: session.isSigningOut,
              label: t('account.myAccount'),
              labels: {
                signOut: t('account.signOut'),
                signingOut: t('account.signingOut'),
              },
              title: page.account.displayName,
            }}
            onSignOut={session.signOut}
          />
        )
      }
      sessionError={
        session.error && <AccountSessionErrorView message={session.error} />
      }
    >
      {children}
    </AccountSectionPageView>
  )
}
