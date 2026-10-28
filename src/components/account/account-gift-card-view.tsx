import type { ReactNode } from 'react'

import type { AccountGiftCardModel } from '@/components/contracts/account'
import { AccountPill, AccountSurface } from './account-ui-view'

export type { AccountGiftCardModel } from '@/components/contracts/account'

export function AccountGiftCardView({ card }: { card: AccountGiftCardModel }) {
  return (
    <AccountSurface>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-normal text-foreground">{card.code}</p>
            <AccountPill>{card.statusLabel}</AccountPill>
          </div>
          <ul className="mt-4 space-y-2 text-xs leading-6 text-muted-foreground">
            {card.detailLines.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          <p className="text-xl font-normal text-foreground">
            {card.displayAmountRemaining ?? '—'}
          </p>
          <p className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">
            {card.remainingLabel}
          </p>
        </div>
      </div>
    </AccountSurface>
  )
}

export function AccountGiftCardGroupView({
  children,
  count,
  label,
}: {
  children: ReactNode
  count: number
  label: string
}) {
  if (!count) {
    return null
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
        {label} ({count})
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
