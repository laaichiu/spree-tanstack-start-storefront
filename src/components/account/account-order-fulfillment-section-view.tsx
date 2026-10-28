import { ExternalLink, Truck } from 'lucide-react'
import type { ReactNode } from 'react'

import type { AccountOrderFulfillmentDisplay } from './account-order-fulfillment-display'
import type {
  AccountOrderStatusLabels,
  AccountOrderStatusTrackingLink,
} from '@/components/contracts/account'
import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
  accountTextLinkClassName,
} from './account-ui-view'
import {
  AccountOrderStatusDetailEmptyNotice,
  AccountOrderStatusDetailInfoBlock,
} from './account-order-status-detail-view'

export function AccountOrderFulfillmentSectionView({
  labels,
  fulfillments,
  renderTrackingLink,
}: {
  labels: AccountOrderStatusLabels
  fulfillments: readonly AccountOrderFulfillmentDisplay[]
  renderTrackingLink: AccountOrderStatusTrackingLink
}) {
  return (
    <AccountSurface className="xl:col-span-3">
      <AccountSectionHeader
        description={labels.fulfillmentDescription}
        title={labels.shipment}
      />
      <div className="mt-6 space-y-4">
        {fulfillments.length ? (
          fulfillments.map((fulfillment) => (
            <FulfillmentCard
              fulfillment={fulfillment}
              key={fulfillment.id}
              labels={labels}
              renderTrackingLink={renderTrackingLink}
            />
          ))
        ) : (
          <AccountOrderStatusDetailEmptyNotice
            icon={
              <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            }
          >
            {labels.noFulfillments}
          </AccountOrderStatusDetailEmptyNotice>
        )}
      </div>
    </AccountSurface>
  )
}

function FulfillmentCard({
  fulfillment,
  labels,
  renderTrackingLink,
}: {
  fulfillment: AccountOrderFulfillmentDisplay
  labels: AccountOrderStatusLabels
  renderTrackingLink: (
    url: string,
    props: { children: ReactNode; className: string },
  ) => ReactNode
}) {
  return (
    <div className="border border-border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
            {fulfillment.shipmentLabel}
          </p>
          <h3 className="mt-2 text-xs font-normal text-foreground">
            {fulfillment.methodName}
          </h3>
        </div>
        <AccountPill>{fulfillment.statusLabel}</AccountPill>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AccountOrderStatusDetailInfoBlock
          label={labels.shippingCost}
          value={fulfillment.shippingCost}
        />
        <AccountOrderStatusDetailInfoBlock
          label={labels.trackingNumber}
          value={fulfillment.tracking}
        />
        <AccountOrderStatusDetailInfoBlock
          label={labels.itemsInShipment}
          value={fulfillment.itemQuantity}
        />
        {fulfillment.fulfilledAt && (
          <AccountOrderStatusDetailInfoBlock
            label={labels.fulfilledAt}
            value={fulfillment.fulfilledAt}
          />
        )}
        {fulfillment.originLabel && (
          <AccountOrderStatusDetailInfoBlock
            label={labels.shippingOrigin}
            value={fulfillment.originLabel}
          />
        )}
      </div>

      {fulfillment.trackingUrl &&
        renderTrackingLink(fulfillment.trackingUrl, {
          children: (
            <>
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              {labels.trackShipment}
            </>
          ),
          className: `${accountTextLinkClassName} mt-4`,
        })}
    </div>
  )
}
