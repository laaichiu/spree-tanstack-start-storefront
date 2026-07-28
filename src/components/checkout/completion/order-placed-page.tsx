import { CircleCheckBig } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { CheckoutRouteErrorState } from '../checkout-route-error-state'
import { OrderPlacedDetails } from './order-placed-details'

export function OrderPlacedPage({ order }: { order: CheckoutOrder | null }) {
  const { market, t } = useMarket()

  if (!order) {
    return <OrderPlacedUnavailableState />
  }

  const firstName = getOrderFirstName(order)
  const orderNumber = getOrderNumber(order)

  return (
    <main className="mx-auto w-full max-w-checkout space-y-10 px-6 py-8 lg:px-14 lg:py-10">
      <header className="space-y-4 border-b border-border pb-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
            <CircleCheckBig
              aria-hidden="true"
              className="h-8 w-8 text-foreground"
            />
          </div>
        </div>
        <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {t('account.order')} {orderNumber}
        </p>
        <h1 className="text-3xl leading-tight font-normal text-foreground">
          {firstName
            ? `${t('checkout.thanksForOrder')}, ${firstName}`
            : t('checkout.orderPlacedTitle')}
        </h1>
        <p className="text-sm leading-6 mx-auto max-w-md text-muted-foreground">
          {t('checkout.orderPlacedPreparing')}
        </p>
        {order.email ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {t('checkout.confirmationSentTo')}{' '}
            <span className="font-normal text-foreground">{order.email}</span>
          </p>
        ) : (
          <p className="text-sm leading-6 text-foreground">
            {t('checkout.orderReference')} {orderNumber}
          </p>
        )}
      </header>

      <OrderPlacedDetails order={order} />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          className={buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          href={`/${market.country}/${market.locale}`}
        >
          {t('checkout.backToStorefront')}
        </a>
        <a
          className={buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
            variant: 'secondary',
          })}
          href={`/${market.country}/${market.locale}/products`}
        >
          {t('cart.continueShopping')}
        </a>
      </div>
    </main>
  )
}

export function OrderPlacedError({ error }: { error: unknown }) {
  const { t } = useMarket()

  return (
    <CheckoutRouteErrorState
      description={t('checkout.orderPlacedUnavailableDescription')}
      error={error}
      title={t('checkout.orderPlacedUnavailable')}
    />
  )
}

function OrderPlacedUnavailableState() {
  const { market, t } = useMarket()

  return (
    <main className="mx-auto flex min-h-checkout w-full max-w-checkout flex-col items-center justify-center px-6 py-14 text-center lg:px-14">
      <h1 className="text-3xl leading-tight font-normal text-foreground">
        {t('checkout.orderPlacedUnavailable')}
      </h1>
      <p className="text-sm leading-6 mx-auto mt-4 max-w-md text-muted-foreground">
        {t('checkout.orderPlacedUnavailableDescription')}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          className={buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          href={`/${market.country}/${market.locale}/products`}
        >
          {t('cart.continueShopping')}
        </a>
        <a
          className={buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
            variant: 'secondary',
          })}
          href={`/${market.country}/${market.locale}`}
        >
          {t('home.shopAll')}
        </a>
      </div>
    </main>
  )
}

function getOrderNumber(order: CheckoutOrder) {
  return order.number?.trim() || order.id
}

function getOrderFirstName(order: CheckoutOrder) {
  const address = order.shippingAddress ?? order.billingAddress

  return (
    address?.firstName?.trim() ||
    address?.fullName.split(' ').filter(Boolean)[0] ||
    null
  )
}
