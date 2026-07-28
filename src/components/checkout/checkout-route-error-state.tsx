import { CircleAlert } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'

type CheckoutRouteErrorStateProps = {
  checkoutHref?: string
  description?: string
  error?: unknown
  title?: string
}

function readRouteErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : null
}

export function CheckoutRouteErrorState({
  checkoutHref,
  description,
  error,
  title,
}: CheckoutRouteErrorStateProps) {
  const { market, t } = useMarket()
  const homeHref = `/${market.country}/${market.locale}`
  const productsHref = `${homeHref}/products`
  const errorMessage = readRouteErrorMessage(error)

  return (
    <main className="mx-auto flex min-h-checkout w-full max-w-checkout flex-col items-center justify-center px-6 py-14 text-center lg:px-14">
      <CircleAlert aria-hidden="true" className="h-9 w-9 text-destructive" />
      <p className="text-sm leading-4 font-normal uppercase mt-6 text-muted-foreground">
        {t('checkout.checkout')}
      </p>
      <h1 className="mt-4 text-3xl leading-tight font-normal text-foreground">
        {title ?? t('checkout.checkoutLoadFailed')}
      </h1>
      <p className="text-sm leading-6 mx-auto mt-4 max-w-md text-muted-foreground">
        {description ?? t('checkout.orderPlacedUnavailableDescription')}
      </p>
      {errorMessage ? (
        <p className="text-sm leading-5 mt-3 max-w-md text-muted-foreground">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {checkoutHref ? (
          <a
            className={buttonClassName({
              className: 'min-h-12 min-w-52 px-8',
              size: 'lg',
            })}
            href={checkoutHref}
          >
            {t('checkout.returnToCheckout')}
          </a>
        ) : null}
        <a
          className={buttonClassName({
            className: 'min-h-12 min-w-52 px-8',
            size: 'lg',
            variant: checkoutHref ? 'secondary' : undefined,
          })}
          href={productsHref}
        >
          {t('cart.continueShopping')}
        </a>
      </div>
    </main>
  )
}
