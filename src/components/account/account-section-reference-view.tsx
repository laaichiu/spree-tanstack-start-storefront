import { Link } from '@tanstack/react-router'
import { ChevronRight, CircleAlert, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

import type {
  AccountSection,
  AccountSectionControllerValue,
} from '@/components/account/account-section-controller'
import {
  AccountMessage,
  AccountPageHeader,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const accountSectionNavItems = [
  {
    key: 'orders',
    labelKey: 'account.orders',
    to: '/$country/$locale/account/orders',
  },
  {
    key: 'addresses',
    labelKey: 'account.addresses',
    to: '/$country/$locale/account/addresses',
  },
  {
    key: 'paymentMethods',
    labelKey: 'account.paymentMethods',
    to: '/$country/$locale/account/credit-cards',
  },
  {
    key: 'giftCards',
    labelKey: 'account.giftCards',
    to: '/$country/$locale/account/gift-cards',
  },
  {
    key: 'profile',
    labelKey: 'account.profile',
    to: '/$country/$locale/account/profile',
  },
] as const

export function AccountSectionReferenceView({
  activeSection,
  children,
  controller,
  showHeader = true,
}: {
  activeSection: AccountSection
  children: ReactNode
  controller: AccountSectionControllerValue
  showHeader?: boolean
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
      {showHeader ? (
        <AccountPageHeader
          action={
            <Button
              disabled={controller.session.isSigningOut}
              onClick={() => void controller.session.signOut()}
              type="button"
              variant="secondary"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {controller.session.isSigningOut
                ? t('account.signingOut')
                : t('account.signOut')}
            </Button>
          }
          description={controller.account.email}
          label={t('account.myAccount')}
          title={controller.account.displayName}
        />
      ) : null}

      {controller.session.error ? (
        <AccountMessage tone="error">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{controller.session.error}</p>
        </AccountMessage>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-4 lg:gap-14">
        <aside className="h-fit">
          <nav className="border-t border-border">
            {accountSectionNavItems.map((item) => (
              <Link
                className={cn(
                  'flex items-center justify-between border-b border-border py-3 text-sm tracking-wider uppercase transition-colors',
                  item.key === activeSection
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={item.key}
                params={marketParams}
                to={item.to}
              >
                {t(item.labelKey)}
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 lg:col-span-3">{children}</main>
      </div>
    </section>
  )
}
