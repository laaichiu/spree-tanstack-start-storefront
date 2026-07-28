import type { ReactNode } from 'react'

import { AccountSectionController } from '@/components/account/account-section-controller'
import type { AccountSection } from '@/components/account/account-section-controller'
import { AccountSectionReferenceView } from '@/components/account/account-section-reference-view'
import { useAccountSession } from '@/components/account/account-session-provider'

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

  return (
    <AccountSectionController customer={customer}>
      {(controller) => (
        <AccountSectionReferenceView
          activeSection={activeSection}
          controller={controller}
          showHeader={showHeader}
        >
          {children}
        </AccountSectionReferenceView>
      )}
    </AccountSectionController>
  )
}
