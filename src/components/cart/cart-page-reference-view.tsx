import { CartEmptyState } from '@/components/cart/cart-empty-state'
import type { CartPageControllerValue } from '@/components/cart/cart-page-controller'
import { CartPageLineItem } from '@/components/cart/cart-page-line-item'
import { CartPageOrderSummary } from '@/components/cart/cart-page-order-summary'
import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'

export function CartPageReferenceView({
  controller,
}: {
  controller: CartPageControllerValue
}) {
  const { t } = useMarket()

  if (controller.status === 'loading') {
    return (
      <section className="w-full px-4 py-14 lg:px-8">
        <p className="text-sm leading-6 text-muted-foreground">
          {t('cart.loadingCart')}
        </p>
      </section>
    )
  }

  if (controller.status === 'error') {
    return <CartPageErrorState recovery={controller.recovery} />
  }

  if (controller.status === 'empty') {
    return <CartEmptyState />
  }

  const { cart, itemActions } = controller

  return (
    <section className="w-full px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-6 lg:space-y-8">
        <header className="space-y-4">
          <h1 className="text-4xl leading-none font-normal tracking-wider text-foreground sm:text-5xl">
            {t('cart.yourBag')}
            <span className="ml-3 inline-block align-middle text-sm leading-4 tracking-wider text-muted-foreground uppercase">
              ({cart.itemCount})
            </span>
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t('cart.shippingNote')}
          </p>
        </header>

        {itemActions.error ? (
          <section className="border border-destructive bg-muted px-4 py-3">
            <p className="text-sm leading-6 text-destructive">
              {itemActions.error}
            </p>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <ul>
              {cart.items.map((item) => (
                <CartPageLineItem
                  isPending={itemActions.pendingLineItemId === item.id}
                  item={item}
                  key={item.id}
                  onRemoveItem={itemActions.removeItem}
                  onUpdateQuantity={itemActions.updateQuantity}
                />
              ))}
            </ul>
          </section>
          <CartPageOrderSummary cart={cart} />
        </div>
      </div>
    </section>
  )
}

function CartPageErrorState({
  recovery,
}: {
  recovery: Extract<CartPageControllerValue, { status: 'error' }>['recovery']
}) {
  const { t } = useMarket()

  return (
    <section className="w-full px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-3xl border border-destructive bg-muted p-6 sm:p-8">
        <p className="text-sm leading-4 font-normal uppercase text-destructive">
          {t('cart.cartLoadFailed')}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('cart.cartLoadFailedDescription')}
        </p>
        <button
          className={buttonClassName({
            className: 'mt-6 min-h-12 min-w-52 px-8',
            size: 'lg',
          })}
          disabled={recovery.isPending}
          onClick={() => void recovery.recover()}
          type="button"
        >
          {recovery.isPending
            ? t('cart.resettingCartSession')
            : t('cart.resetCartSession')}
        </button>
        {recovery.error ? (
          <p className="mt-4 text-sm leading-6 text-destructive">
            {recovery.error}
          </p>
        ) : null}
      </div>
    </section>
  )
}
