import { Link } from '@tanstack/react-router'

import { CartDrawerLineItem } from '@/components/cart/cart-drawer-line-item'
import { buttonClassName } from '@/components/ui/button'
import type { CartLineItem, CartSummary } from '@/lib/cart/model/cart'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { useMarket } from '@/components/layout/market-provider'

type CartDrawerBodyProps = {
  activeCart: CartSummary | null
  cartMutationError: string | null
  error: Error | null
  isLoading: boolean
  items: CartLineItem[]
  marketParams: { country: string; locale: string }
  onClose: () => void
  onRecoverCartSession: () => Promise<void>
  onRemoveItem: (lineItemId: string) => Promise<void>
  onUpdateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  pendingLineItemId: string | null
  isResetPending: boolean
}

export function CartDrawerBody({
  activeCart,
  cartMutationError,
  error,
  isLoading,
  items,
  marketParams,
  onClose,
  onRecoverCartSession,
  onRemoveItem,
  onUpdateQuantity,
  pendingLineItemId,
  isResetPending,
}: CartDrawerBodyProps) {
  const { t } = useMarket()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {isLoading ? (
        <p className="text-sm leading-6 px-5 py-6 text-muted-foreground">
          {t('cart.loadingCart')}
        </p>
      ) : error ? (
        <CartDrawerErrorState
          cartMutationError={cartMutationError}
          isResetPending={isResetPending}
          onRecoverCartSession={onRecoverCartSession}
        />
      ) : !activeCart ? (
        <CartDrawerEmptyState marketParams={marketParams} onClose={onClose} />
      ) : (
        <>
          {cartMutationError ? (
            <p className="text-sm leading-6 px-5 pt-6 pb-4 text-destructive">
              {cartMutationError}
            </p>
          ) : null}
          <ul>
            {items.map((item) => (
              <CartDrawerLineItem
                item={item}
                key={item.id}
                marketParams={marketParams}
                onClose={onClose}
                onRemoveItem={onRemoveItem}
                onUpdateQuantity={onUpdateQuantity}
                pending={pendingLineItemId === item.id}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function CartDrawerErrorState({
  cartMutationError,
  isResetPending,
  onRecoverCartSession,
}: Pick<
  CartDrawerBodyProps,
  'cartMutationError' | 'isResetPending' | 'onRecoverCartSession'
>) {
  const { t } = useMarket()

  return (
    <div className="px-5 py-6">
      <p className="text-sm leading-6 text-destructive">
        {t('cart.cartLoadFailed')}
      </p>
      <p className="text-sm leading-6 mt-2 text-muted-foreground">
        {t('cart.cartLoadFailedDescription')}
      </p>
      <button
        className={buttonClassName({
          className: 'mt-5 min-h-12 w-full',
          size: 'lg',
        })}
        disabled={isResetPending}
        onClick={() => void onRecoverCartSession()}
        type="button"
      >
        {isResetPending
          ? t('cart.resettingCartSession')
          : t('cart.resetCartSession')}
      </button>
      {cartMutationError ? (
        <p className="text-sm leading-6 mt-4 text-destructive">
          {cartMutationError}
        </p>
      ) : null}
    </div>
  )
}

function CartDrawerEmptyState({
  marketParams,
  onClose,
}: Pick<CartDrawerBodyProps, 'marketParams' | 'onClose'>) {
  const { t } = useMarket()

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-16 text-center">
      <h2 className="mt-7 text-2xl leading-tight font-normal tracking-wider text-foreground">
        {t('cart.emptyBagHeading')}
      </h2>
      <p className="text-sm leading-6 mt-4 max-w-md text-muted-foreground">
        {t('cart.emptyDrawerDescription')}
      </p>
      <Link
        className={buttonClassName({
          className: 'mt-8 min-h-13 px-8',
          size: 'lg',
        })}
        onClick={onClose}
        params={marketParams}
        search={DEFAULT_PRODUCT_LISTING_SEARCH}
        to="/$country/$locale/products"
      >
        {t('cart.startShopping')}
      </Link>
    </div>
  )
}
