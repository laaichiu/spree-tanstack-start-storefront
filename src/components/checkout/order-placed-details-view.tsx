import { Package } from 'lucide-react'
import type { ReactNode } from 'react'

import type { AddressDisplay } from '@/lib/core/address'
import type { OrderPlacedDetailsModel } from '../contracts/checkout'

export type {
  OrderPlacedDetailsCopy,
  OrderPlacedDetailsModel,
} from '../contracts/checkout'

export function OrderPlacedDetailsView({
  model,
}: {
  model: OrderPlacedDetailsModel
}) {
  const {
    billingAddress,
    copy,
    fulfillments,
    paymentStatus,
    payments,
    shippingAddress,
  } = model

  return (
    <section className="space-y-5">
      <h2 className="text-lg md:text-xl font-normal text-foreground">
        {copy.orderDetails}
      </h2>
      <div className="space-y-6 border border-border p-5 sm:p-6">
        <DetailGroup title={copy.fulfillment}>
          {fulfillments.length ? (
            <div className="space-y-4">
              {fulfillments.map((fulfillment) => (
                <div
                  className="flex items-start gap-3 border border-border px-4 py-4 text-xs leading-6 text-muted-foreground"
                  key={fulfillment.id}
                >
                  <Package
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <div className="space-y-1">
                    <p className="font-normal text-foreground">
                      {fulfillment.methodName}
                    </p>
                    <p>
                      {copy.status}: {fulfillment.status}
                    </p>
                    <p>
                      {copy.cost}: {fulfillment.cost}
                    </p>
                    {fulfillment.tracking && (
                      <p>
                        {copy.tracking}:{' '}
                        {fulfillment.trackingHref ? (
                          <a
                            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-muted-foreground"
                            href={fulfillment.trackingHref}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {fulfillment.tracking}
                          </a>
                        ) : (
                          fulfillment.tracking
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-6 text-muted-foreground">
              {copy.fulfillmentDetailsPending}
            </p>
          )}
        </DetailGroup>

        <DetailGroup separated title={copy.payment}>
          {payments.length ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  className="border border-border px-4 py-4 text-xs leading-6 text-muted-foreground"
                  key={payment.id}
                >
                  <p className="font-normal text-foreground">
                    {payment.methodName}
                  </p>
                  {payment.sourceLabel && <p>{payment.sourceLabel}</p>}
                  <p>
                    {copy.status}: {payment.status}
                  </p>
                  <p>
                    {copy.paymentAmount}: {payment.amount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-6 text-muted-foreground">
              {copy.paymentStatus}: {paymentStatus}
            </p>
          )}
        </DetailGroup>

        {shippingAddress && (
          <AddressGroup
            address={shippingAddress}
            title={copy.shippingAddress}
          />
        )}
        {billingAddress && (
          <AddressGroup address={billingAddress} title={copy.billingAddress} />
        )}
      </div>
    </section>
  )
}

function DetailGroup({
  children,
  separated = false,
  title,
}: {
  children: ReactNode
  separated?: boolean
  title: string
}) {
  return (
    <div
      className={
        separated ? 'space-y-3 border-t border-border pt-6' : 'space-y-3'
      }
    >
      <h3 className="text-xs leading-4 font-normal tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  )
}

function AddressGroup({
  address,
  title,
}: {
  address: AddressDisplay
  title: string
}) {
  return (
    <DetailGroup separated title={title}>
      <div className="space-y-1.5 text-xs leading-6 text-muted-foreground">
        <p className="font-normal text-foreground">{address.fullName}</p>
        {address.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </DetailGroup>
  )
}
