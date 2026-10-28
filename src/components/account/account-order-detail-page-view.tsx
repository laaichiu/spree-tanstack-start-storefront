import { CircleAlert, PackageSearch } from 'lucide-react'

import { AccountEmptyState } from '@/components/account/account-ui-view'
import type { AccountOrderDetailPageProps } from '@/components/contracts/account'

export type {
  AccountOrderDetailPageLabels,
  AccountOrderDetailPageModel,
  AccountOrderDetailPageProps,
  AccountOrderDetailPageSections,
  AccountOrderDetailPageState,
} from '@/components/contracts/account'

export function AccountOrderDetailPageView(props: AccountOrderDetailPageProps) {
  const { labels, state } = props.model

  if ('sections' in props) {
    return (
      <div className="space-y-6">
        {props.backLink}
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">{props.sections.header}</div>
          <div className="xl:col-span-2">{props.sections.summary}</div>
        </div>
        {props.sections.items}
        {props.sections.reviews}
        {props.sections.orderStatus}
        {props.sections.addresses}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {props.backLink}

      <AccountEmptyState
        description={labels.loadFailedDescription}
        icon={
          state.status === 'error' ? (
            <CircleAlert aria-hidden="true" className="h-5 w-5" />
          ) : (
            <PackageSearch aria-hidden="true" className="h-5 w-5" />
          )
        }
        title={
          state.status === 'error' ? labels.loadFailed : labels.missingOrder
        }
      />
    </div>
  )
}
