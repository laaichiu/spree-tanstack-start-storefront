import type {
  AccountOrderStatusModel,
  AccountOrderStatusTrackingLink,
} from '@/components/contracts/account'
import { AccountOrderFulfillmentSectionView } from '@/components/account/account-order-fulfillment-section-view'
import { AccountOrderPaymentSectionView } from '@/components/account/account-order-payment-section-view'

export type {
  AccountOrderStatusLabels,
  AccountOrderStatusModel,
  AccountOrderStatusTrackingLink,
} from '@/components/contracts/account'

export function AccountOrderStatusView({
  model,
  renderTrackingLink,
}: {
  model: AccountOrderStatusModel
  renderTrackingLink: AccountOrderStatusTrackingLink
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <AccountOrderFulfillmentSectionView
        fulfillments={model.fulfillments}
        labels={model.labels}
        renderTrackingLink={renderTrackingLink}
      />
      <AccountOrderPaymentSectionView
        labels={model.labels}
        payments={model.payments}
      />
    </div>
  )
}
