import { Package } from 'lucide-react'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { ProductPrice } from '@/components/shared/product-price'
import { getAddressLines } from '@/lib/account/model/customer-address'
import type {
  CheckoutAddress,
  CheckoutOrder,
} from '@/lib/checkout/model/checkout'
import { formatStatusLabel } from '@/lib/i18n/format-status-label'

function OrderDetailGroup({
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
      <h3 className="text-sm leading-4 font-normal tracking-widest text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  )
}

function AddressDetails({ address }: { address: CheckoutAddress }) {
  return (
    <div className="space-y-1.5 text-sm leading-6 text-muted-foreground">
      <p className="font-normal text-foreground">{address.fullName}</p>
      {getAddressLines(address).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

function OrderTotalRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm leading-5">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right text-foreground">{value}</div>
    </div>
  )
}

export function OrderPlacedDetails({ order }: { order: CheckoutOrder }) {
  const { market, t } = useMarket()
  const fulfillments = order.fulfillments ?? []
  const payments = order.payments ?? []
  const paymentStatus = formatStatusLabel(
    order.paymentStatus ?? payments[0]?.status ?? null,
  )
  const fulfillmentStatus = formatStatusLabel(
    order.fulfillmentStatus ?? fulfillments[0]?.status ?? null,
  )

  return (
    <>
      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl leading-none font-normal text-foreground">
            {t('account.orderItems')}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {t('checkout.orderItemsDescription')}
          </p>
        </div>
        <ul className="divide-y divide-border border border-border">
          {order.items.map((item) => {
            const productHref = `/${market.country}/${market.locale}/products/${encodeURIComponent(item.productSlug)}`

            return (
              <li className="flex gap-4 px-5 py-5" key={item.id}>
                <a
                  className="h-[4.875rem] w-16 shrink-0 bg-muted focus-visible:focus-ring"
                  href={productHref}
                >
                  <span className="block h-full w-full overflow-hidden border border-border bg-muted">
                    {item.imageUrl ? (
                      <img
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        src={item.imageUrl}
                      />
                    ) : (
                      <span className="text-sm leading-6 flex h-full items-center justify-center px-2 text-center text-muted-foreground">
                        {t('product.imageComingSoon')}
                      </span>
                    )}
                  </span>
                </a>
                <div className="min-w-0 flex-1 space-y-1">
                  <a
                    className="block text-sm leading-5 font-normal tracking-wider text-foreground transition-colors hover:text-muted-foreground focus-visible:focus-ring"
                    href={productHref}
                  >
                    {item.name}
                  </a>
                  {item.optionsText ? (
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {item.optionsText.replace(/^Color:\s*/i, '')}
                    </p>
                  ) : null}
                  <p className="text-sm leading-5 text-muted-foreground">
                    {t('account.quantity')} {item.quantity}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5 text-right text-sm leading-5 font-normal text-foreground">
                  <ProductPrice price={item.totalPrice} variant="listing" />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl leading-none font-normal text-foreground">
          {t('checkout.orderDetails')}
        </h2>
        <div className="space-y-6 border border-border p-5 sm:p-6">
          <OrderDetailGroup title={t('checkout.fulfillment')}>
            {fulfillments.length ? (
              <div className="space-y-4">
                {fulfillments.map((fulfillment) => (
                  <div
                    className="flex items-start gap-3 border border-border px-4 py-4 text-sm leading-6 text-muted-foreground"
                    key={fulfillment.id}
                  >
                    <Package
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                    />
                    <div className="space-y-1">
                      <p className="font-normal text-foreground">
                        {fulfillment.methodName ||
                          t('account.shippingMethodUnavailable')}
                      </p>
                      <p>
                        {t('checkout.status')}:{' '}
                        {formatStatusLabel(fulfillment.status)}
                      </p>
                      <p>
                        {t('checkout.cost')}: {fulfillment.displayCost}
                      </p>
                      {fulfillment.tracking ? (
                        <p>
                          {t('checkout.tracking')}:{' '}
                          {fulfillment.trackingUrl ? (
                            <a
                              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-muted-foreground"
                              href={fulfillment.trackingUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {fulfillment.tracking}
                            </a>
                          ) : (
                            fulfillment.tracking
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {t('checkout.fulfillmentDetailsPending')}
              </p>
            )}
          </OrderDetailGroup>

          <OrderDetailGroup separated title={t('checkout.payment')}>
            {payments.length ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    className="border border-border px-4 py-4 text-sm leading-6 text-muted-foreground"
                    key={payment.id}
                  >
                    <p className="font-normal text-foreground">
                      {payment.methodName || t('account.payment')}
                    </p>
                    {payment.sourceLabel ? <p>{payment.sourceLabel}</p> : null}
                    <p>
                      {t('checkout.status')}:{' '}
                      {formatStatusLabel(payment.status)}
                    </p>
                    <p>
                      {t('checkout.paymentAmount')}: {payment.displayAmount}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                {t('checkout.status')}: {paymentStatus}
              </p>
            )}
          </OrderDetailGroup>

          {order.shippingAddress ? (
            <OrderDetailGroup separated title={t('account.shippingAddress')}>
              <AddressDetails address={order.shippingAddress} />
            </OrderDetailGroup>
          ) : null}

          {order.billingAddress ? (
            <OrderDetailGroup separated title={t('account.billingAddress')}>
              <AddressDetails address={order.billingAddress} />
            </OrderDetailGroup>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 border border-border p-5">
        <h2 className="text-2xl leading-none font-normal text-foreground">
          {t('cart.total')}
        </h2>
        <OrderTotalRow
          label={t('cart.subtotal')}
          value={<ProductPrice price={order.itemTotal} variant="listing" />}
        />
        <OrderTotalRow
          label={t('cart.shipping')}
          value={<ProductPrice price={order.deliveryTotal} variant="listing" />}
        />
        <OrderTotalRow
          label={t('cart.discount')}
          value={<ProductPrice price={order.discountTotal} variant="listing" />}
        />
        <OrderTotalRow
          label={t('cart.tax')}
          value={<ProductPrice price={order.taxTotal} variant="listing" />}
        />
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <span className="text-lg leading-6 font-normal text-foreground">
            {t('cart.total')}
          </span>
          <ProductPrice price={order.total} variant="detail" />
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <OrderTotalRow
            label={t('checkout.paymentStatus')}
            value={paymentStatus}
          />
          <OrderTotalRow
            label={t('checkout.fulfillmentStatus')}
            value={fulfillmentStatus}
          />
        </div>
      </section>
    </>
  )
}
