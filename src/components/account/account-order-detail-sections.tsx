import { ExternalLink, Receipt, Truck } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
  accountTextLinkClassName,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { getAddressLines } from '@/lib/account/model/customer-address'
import type {
  OrderAddress,
  OrderDetail,
  OrderFulfillment,
  OrderPayment,
} from '@/lib/account/model/order'
import { formatDateTime } from '@/lib/i18n/messages'
import { formatStatusLabel } from '@/lib/i18n/format-status-label'

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function EmptyNotice({
  children,
  icon,
}: {
  children: ReactNode
  icon: ReactNode
}) {
  return (
    <div className="mt-6 flex gap-3 border border-border bg-muted px-4 py-4 text-muted-foreground">
      {icon}
      <p className="text-sm leading-6">{children}</p>
    </div>
  )
}

function FulfillmentCard({ fulfillment }: { fulfillment: OrderFulfillment }) {
  const { market, t } = useMarket()
  const shipmentLabel = fulfillment.number
    ? `${t('account.shipmentNumber')} ${fulfillment.number}`
    : t('account.shipment')

  return (
    <div className="border border-border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
            {shipmentLabel}
          </p>
          <h3 className="mt-2 text-lg font-normal text-foreground">
            {fulfillment.methodName || t('account.shippingMethodUnavailable')}
          </h3>
        </div>
        <AccountPill>{formatStatusLabel(fulfillment.status, '-')}</AccountPill>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <InfoBlock
          label={t('account.shippingCost')}
          value={fulfillment.displayCost ?? '—'}
        />
        <InfoBlock
          label={t('account.trackingNumber')}
          value={fulfillment.tracking || t('account.noTrackingInfo')}
        />
        <InfoBlock
          label={t('account.itemsInShipment')}
          value={String(fulfillment.itemQuantity)}
        />
        {fulfillment.fulfilledAt ? (
          <InfoBlock
            label={t('account.fulfilledAt')}
            value={formatDateTime(fulfillment.fulfilledAt, market.locale)}
          />
        ) : null}
        {fulfillment.originLabel ? (
          <InfoBlock
            label={t('account.shippingOrigin')}
            value={fulfillment.originLabel}
          />
        ) : null}
      </div>

      {fulfillment.trackingUrl ? (
        <a
          className={accountTextLinkClassName + ' mt-4'}
          href={fulfillment.trackingUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          {t('account.trackShipment')}
        </a>
      ) : null}
    </div>
  )
}

function PaymentCard({ payment }: { payment: OrderPayment }) {
  const { t } = useMarket()

  return (
    <div className="border border-border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-normal text-foreground">
            {payment.methodName || t('account.payment')}
          </h3>
          {payment.sourceLabel ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {payment.sourceLabel}
            </p>
          ) : null}
        </div>
        <AccountPill>{formatStatusLabel(payment.status, '-')}</AccountPill>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <InfoBlock
          label={t('account.paymentAmount')}
          value={payment.displayAmount ?? '—'}
        />
        {payment.number ? (
          <InfoBlock
            label={t('account.paymentReference')}
            value={payment.number}
          />
        ) : null}
        {payment.responseCode ? (
          <InfoBlock
            label={t('account.authorizationCode')}
            value={payment.responseCode}
          />
        ) : null}
      </div>
    </div>
  )
}

export function OrderStatusSections({ order }: { order: OrderDetail }) {
  const { t } = useMarket()

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <AccountSurface className="xl:col-span-3">
        <AccountSectionHeader
          description={t('account.shipmentDescription')}
          title={t('account.shipment')}
        />
        <div className="mt-6 space-y-4">
          {order.fulfillments.length ? (
            order.fulfillments.map((fulfillment) => (
              <FulfillmentCard fulfillment={fulfillment} key={fulfillment.id} />
            ))
          ) : (
            <EmptyNotice
              icon={
                <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              }
            >
              {t('account.noFulfillmentsYet')}
            </EmptyNotice>
          )}
        </div>
      </AccountSurface>

      <AccountSurface className="xl:col-span-2">
        <AccountSectionHeader
          description={t('account.paymentDescription')}
          title={t('account.paymentInformation')}
        />
        <div className="mt-6 space-y-4">
          {order.payments.length ? (
            order.payments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          ) : (
            <EmptyNotice
              icon={
                <Receipt
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
              }
            >
              {t('account.noPaymentsRecorded')}
            </EmptyNotice>
          )}
        </div>
      </AccountSurface>
    </div>
  )
}

function AddressDetails({ address }: { address: OrderAddress }) {
  return (
    <div className="space-y-1.5 text-sm leading-6 text-muted-foreground">
      <p className="font-normal text-foreground">{address.fullName}</p>
      {getAddressLines(address).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

export function OrderAddressSections({ order }: { order: OrderDetail }) {
  const { t } = useMarket()

  if (!order.shippingAddress && !order.billingAddress) {
    return null
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {order.shippingAddress ? (
        <AccountSurface>
          <AccountSectionHeader title={t('account.shippingAddress')} />
          <div className="mt-6">
            <AddressDetails address={order.shippingAddress} />
          </div>
        </AccountSurface>
      ) : null}
      {order.billingAddress ? (
        <AccountSurface>
          <AccountSectionHeader title={t('account.billingAddress')} />
          <div className="mt-6">
            <AddressDetails address={order.billingAddress} />
          </div>
        </AccountSurface>
      ) : null}
    </div>
  )
}
