import { Link } from '@tanstack/react-router'

import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import type { OrderDetail } from '@/lib/account/model/order'
import { formatDateTime } from '@/lib/i18n/messages'
import { hasMeaningfulMoney } from '@/lib/money/money'
import { formatStatusLabel } from '@/lib/i18n/format-status-label'

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string
  strong?: boolean
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong ? 'font-normal text-foreground' : 'text-muted-foreground'
        }
      >
        {label}
      </span>
      <span
        className={strong ? 'font-normal text-foreground' : 'text-foreground'}
      >
        {value}
      </span>
    </div>
  )
}

export function OrderHeaderCard({ order }: { order: OrderDetail }) {
  const { market, t } = useMarket()

  return (
    <AccountSurface>
      <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
        {t('account.order')}
      </p>
      <h1 className="mt-3 text-2xl leading-tight font-normal text-foreground">
        {t('account.orderTitlePrefix')} {order.number}
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {t('account.placedOn')}{' '}
        {formatDateTime(order.completedAt, market.locale)}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <AccountPill>
          {formatStatusLabel(
            order.paymentStatus,
            t('account.orderStatusUnavailable'),
          )}
        </AccountPill>
        <AccountPill>
          {formatStatusLabel(
            order.fulfillmentStatus,
            t('account.fulfillmentUnavailable'),
          )}
        </AccountPill>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <OrderMetaStat
          label={t('account.itemsLabel')}
          value={String(order.totalQuantity)}
        />
        <OrderMetaStat
          label={t('account.shipmentsLabel')}
          value={String(order.fulfillments.length)}
        />
        <OrderMetaStat
          label={t('account.amountDue')}
          value={order.displayAmountDue ?? '—'}
        />
      </div>

      {order.customerNote ? (
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
            {t('account.specialInstructions')}
          </p>
          <p className="mt-3 border border-border bg-muted px-4 py-4 text-sm leading-7 whitespace-pre-wrap text-muted-foreground">
            {order.customerNote}
          </p>
        </div>
      ) : null}
    </AccountSurface>
  )
}

function OrderMetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-muted px-4 py-3">
      <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-normal text-foreground">{value}</p>
    </div>
  )
}

export function OrderSummaryCard({ order }: { order: OrderDetail }) {
  const { t } = useMarket()

  return (
    <AccountSurface className="h-fit xl:sticky xl:top-6">
      <AccountSectionHeader
        description={t('account.orderSummaryDescription')}
        title={t('cart.orderSummary')}
      />
      <div className="mt-6 border border-border bg-muted px-5 py-5">
        <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {t('cart.total')}
        </p>
        <p className="mt-2 text-2xl leading-none font-normal text-foreground">
          {order.displayTotal ?? '—'}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {hasMeaningfulMoney(order.amountDue)
            ? `${t('account.amountDue')}: ${order.displayAmountDue ?? '—'}`
            : t('account.orderPaidInFull')}
        </p>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <SummaryRow
          label={t('cart.subtotal')}
          value={order.displayItemTotal ?? '—'}
        />
        <SummaryRow
          label={t('cart.shipping')}
          value={order.displayDeliveryTotal ?? '—'}
        />
        {hasMeaningfulMoney(order.discountTotal) ? (
          <SummaryRow
            label={t('account.discount')}
            value={order.displayDiscountTotal ?? '—'}
          />
        ) : null}
        {hasMeaningfulMoney(order.taxTotal) ? (
          <SummaryRow
            label={t('cart.tax')}
            value={order.displayTaxTotal ?? '—'}
          />
        ) : null}
        {hasMeaningfulMoney(order.giftCardTotal) ? (
          <SummaryRow
            label={t('account.giftCardLabel')}
            value={order.displayGiftCardTotal ?? '—'}
          />
        ) : null}
        {hasMeaningfulMoney(order.storeCreditTotal) ? (
          <SummaryRow
            label={t('account.storeCredit')}
            value={order.displayStoreCreditTotal ?? '—'}
          />
        ) : null}
        <div className="border-t border-border pt-3">
          <SummaryRow
            label={t('cart.total')}
            strong
            value={order.displayTotal ?? '—'}
          />
        </div>
      </div>
    </AccountSurface>
  )
}

export function OrderItemsCard({ order }: { order: OrderDetail }) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <AccountSurface>
      <AccountSectionHeader
        description={t('account.orderItemsDescription')}
        title={t('account.orderItems')}
      />
      <ul className="mt-6 space-y-4">
        {order.items.map((item) => (
          <li
            className="flex flex-col gap-5 border border-border bg-muted p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-5"
            key={item.id}
          >
            <div className="h-28 w-28 shrink-0 overflow-hidden bg-background">
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="h-full w-full object-cover"
                  src={item.imageUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-muted-foreground">
                  {t('account.noImage')}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-normal text-foreground">
                {item.slug ? (
                  <Link
                    className="transition-colors hover:text-muted-foreground"
                    params={{ ...marketParams, slug: item.slug }}
                    to="/$country/$locale/products/$slug"
                  >
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}
              </h2>
              {item.optionsText ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.optionsText}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-sm leading-6 text-muted-foreground">
                <span className="inline-flex border border-border bg-background px-2.5 py-1">
                  {t('account.quantity')} {item.quantity}
                </span>
                <span className="inline-flex border border-border bg-background px-2.5 py-1">
                  {t('account.each')} {item.displayPrice}
                </span>
              </div>
            </div>
            <div className="sm:w-32 sm:text-right">
              <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
                {t('account.lineTotal')}
              </p>
              <p className="mt-2 text-xl font-normal text-foreground">
                {item.displayTotal}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AccountSurface>
  )
}
