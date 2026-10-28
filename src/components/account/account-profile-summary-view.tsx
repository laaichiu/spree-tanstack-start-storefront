import { Mail, Phone, Store, User } from 'lucide-react'
import type { ReactNode } from 'react'

import type { AccountProfileSummaryModel } from '@/components/contracts/account'
import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
} from './account-ui-view'

function ProfileFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-border text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <dt className="text-xs leading-4 font-normal uppercase text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-2 text-xs leading-6 text-foreground break-words">
          {value}
        </dd>
      </div>
    </div>
  )
}

export function AccountProfileSummaryView({
  model,
}: {
  model: AccountProfileSummaryModel
}) {
  const { customer, labels } = model
  const notProvided = <AccountPill>{labels.notProvided}</AccountPill>

  return (
    <AccountSurface className="xl:col-span-2">
      <AccountSectionHeader
        description={labels.accountInformationDescription}
        title={labels.accountInformation}
      />

      <dl className="mt-6">
        <ProfileFact
          icon={<User aria-hidden="true" className="h-4 w-4" />}
          label={labels.name}
          value={customer.name ?? notProvided}
        />
        <ProfileFact
          icon={<Mail aria-hidden="true" className="h-4 w-4" />}
          label={labels.email}
          value={customer.email}
        />
        <ProfileFact
          icon={<Phone aria-hidden="true" className="h-4 w-4" />}
          label={labels.phone}
          value={customer.phone ?? notProvided}
        />
        <ProfileFact
          icon={<Store aria-hidden="true" className="h-4 w-4" />}
          label={labels.storeCredit}
          value={customer.storeCredit ?? notProvided}
        />
      </dl>
    </AccountSurface>
  )
}
