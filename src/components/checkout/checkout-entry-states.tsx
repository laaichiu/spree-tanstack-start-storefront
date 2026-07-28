import { CircleAlert } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'

export function CheckoutLoadingState() {
  const { t } = useMarket()

  return (
    <section className="w-full px-4 py-14 lg:px-8">
      <p className="text-sm leading-6 text-muted-foreground">
        {t('checkout.loadingCheckout')}
      </p>
    </section>
  )
}

export function CheckoutLoadErrorState({
  errorMessage,
  isResetPending,
  onReset,
}: {
  errorMessage: string | null
  isResetPending: boolean
  onReset: () => void
}) {
  const { t } = useMarket()

  return (
    <section className="w-full px-4 py-14 lg:px-8">
      <div className="max-w-3xl border border-destructive bg-muted px-5 py-5">
        <div className="flex gap-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm leading-6">
              {t('checkout.checkoutLoadFailed')}
            </p>
            <p className="text-sm leading-6 mt-2 text-muted-foreground">
              {errorMessage ?? t('cart.cartLoadFailedDescription')}
            </p>
          </div>
        </div>
        <button
          className={buttonClassName({
            className: 'mt-5 min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          disabled={isResetPending}
          onClick={onReset}
          type="button"
        >
          {isResetPending
            ? t('cart.resettingCartSession')
            : t('cart.resetCartSession')}
        </button>
      </div>
    </section>
  )
}

export function CheckoutUnavailableState() {
  const { market, t } = useMarket()
  const productsHref = `/${market.country}/${market.locale}/products`

  return (
    <section className="flex min-h-checkout-entry items-center justify-center px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-xl text-center">
        <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {t('checkout.checkout')}
        </p>
        <h1 className="mt-4 text-2xl leading-tight font-normal text-foreground sm:text-3xl">
          {t('checkout.checkoutUnavailable')}
        </h1>
        <p className="text-sm leading-6 mx-auto mt-4 max-w-md text-muted-foreground">
          {t('checkout.checkoutUnavailableDescription')}
        </p>
        <div className="mt-7 flex justify-center">
          <a
            className={buttonClassName({
              className: 'min-h-12 min-w-56 px-8',
              size: 'lg',
            })}
            href={productsHref}
          >
            {t('cart.shopAllProducts')}
          </a>
        </div>
      </div>
    </section>
  )
}
