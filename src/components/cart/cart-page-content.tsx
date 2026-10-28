import { CartEmptyState } from '@/components/cart/cart-empty-state'
import { CartErrorStateView } from '@/components/cart/cart-error-state-view'
import { getCartItemCountLabel } from '@/components/cart/cart-item-count-display'
import { CartPageHeaderView } from '@/components/cart/cart-page-header-view'
import { CartPageLineItem } from '@/components/cart/cart-page-line-item'
import { CartPageOrderSummary } from '@/components/cart/cart-page-order-summary'
import { CartPageView } from '@/components/cart/cart-page-view'
import type { CartPageControllerValue } from '@/components/cart/cart-page-controller'
import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/contracts'
import type { MessageKey } from '@/lib/i18n/messages'

import { CartPageController } from './cart-page-controller'

type CartPageContentProps = {
  initialCart?: CartSummary | null
  initialCartLoadError?: string | null
}

export function CartPageContent({
  initialCart,
  initialCartLoadError = null,
}: CartPageContentProps = {}) {
  const { t } = useMarket()

  return (
    <CartPageController
      initialCart={initialCart}
      initialCartLoadError={initialCartLoadError}
    >
      {(controller) => renderCartPage(controller, t)}
    </CartPageController>
  )
}

function renderCartPage(
  controller: CartPageControllerValue,
  t: (key: MessageKey) => string,
) {
  switch (controller.status) {
    case 'empty':
      return <CartPageView status="empty" content={<CartEmptyState />} />
    case 'error':
      return (
        <CartPageView
          status="error"
          content={
            <CartErrorStateView
              model={{
                actionLabel: t('cart.resetCartSession'),
                description: t('cart.cartLoadFailedDescription'),
                error: controller.recovery.error,
                isPending: controller.recovery.isPending,
                pendingActionLabel: t('cart.resettingCartSession'),
                title: t('cart.cartLoadFailed'),
              }}
              onRecover={controller.recovery.recover}
            />
          }
        />
      )
    case 'loading':
      return (
        <CartPageView
          status="loading"
          content={
            <section className="w-full px-4 py-14 lg:px-8">
              <p className="text-xs leading-6 text-muted-foreground">
                {t('cart.loadingCart')}
              </p>
            </section>
          }
        />
      )
    case 'ready':
      return renderReadyCartPage(controller, t)
  }
}

function renderReadyCartPage(
  controller: Extract<CartPageControllerValue, { status: 'ready' }>,
  t: (key: MessageKey) => string,
) {
  return (
    <CartPageView
      header={
        <CartPageHeaderView
          model={{
            itemCountLabel: getCartItemCountLabel({
              itemCount: controller.cart.itemCount,
              itemPlural: t('cart.itemPlural'),
              itemSingular: t('cart.itemSingular'),
            }),
            shippingNote: t('cart.shippingNote'),
            title: t('cart.yourBag'),
          }}
        />
      }
      itemError={
        controller.itemActions.error && (
          <section className="border border-destructive bg-muted px-4 py-3">
            <p className="text-xs leading-6 text-destructive">
              {controller.itemActions.error}
            </p>
          </section>
        )
      }
      lineItems={controller.cart.items.map((item) => (
        <CartPageLineItem
          isPending={controller.itemActions.isCartMutationPending}
          item={item}
          key={item.id}
          onRemoveItem={controller.itemActions.removeItem}
          onUpdateQuantity={controller.itemActions.updateQuantity}
        />
      ))}
      orderSummary={
        <CartPageOrderSummary
          amounts={controller.summary}
          cart={controller.cart}
        />
      }
      status="ready"
    />
  )
}
