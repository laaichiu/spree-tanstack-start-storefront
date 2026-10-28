import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import type { AccountSection } from '@/lib/account/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { cn } from '@/components/ui/utils'

const accountNavigationItems = [
  {
    labelKey: 'account.orders',
    section: 'orders',
    to: '/$country/$locale/account/orders',
  },
  {
    labelKey: 'account.addresses',
    section: 'addresses',
    to: '/$country/$locale/account/addresses',
  },
  {
    labelKey: 'account.paymentMethods',
    section: 'paymentMethods',
    to: '/$country/$locale/account/credit-cards',
  },
  {
    labelKey: 'account.giftCards',
    section: 'giftCards',
    to: '/$country/$locale/account/gift-cards',
  },
  {
    labelKey: 'account.profile',
    section: 'profile',
    to: '/$country/$locale/account/profile',
  },
] as const satisfies readonly {
  labelKey: MessageKey
  section: AccountSection
  to: string
}[]

export function AccountSectionNavigationView({
  activeSection,
}: {
  activeSection: AccountSection
}) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <aside className="h-fit">
      <nav
        aria-label={t('account.myAccount')}
        className="border-t border-border"
      >
        {accountNavigationItems.map(({ labelKey, section, to }) => (
          <Link
            className={cn(
              'flex items-center justify-between border-b border-border py-3 text-xs tracking-wider uppercase transition-colors',
              section === activeSection
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            key={section}
            params={marketParams}
            to={to}
          >
            {t(labelKey)}
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        ))}
      </nav>
    </aside>
  )
}
