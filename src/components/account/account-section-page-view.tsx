import type { ReactNode } from 'react'

import { AccountMessage } from '@/components/account/account-ui-view'
import { AccountSectionNavigationView } from '@/components/account/account-section-navigation-view'
import type { AccountSection } from '@/lib/account/contracts'

/**
 * The current storefront owns the protected account section layout and
 * navigation presentation. Authentication and customer ownership remain
 * inside the account feature boundary.
 */
export function AccountSectionPageView({
  activeSection,
  children,
  header,
  sessionError,
}: {
  activeSection: AccountSection
  children: ReactNode
  header?: ReactNode
  sessionError?: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
      {header}
      {sessionError && (
        <AccountMessage tone="error">{sessionError}</AccountMessage>
      )}

      <div className="grid gap-10 lg:grid-cols-4 lg:gap-14">
        <AccountSectionNavigationView activeSection={activeSection} />

        <main className="min-w-0 lg:col-span-3">{children}</main>
      </div>
    </section>
  )
}
