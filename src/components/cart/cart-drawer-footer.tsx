import { Link } from '@tanstack/react-router'
import { ArrowRight, LockKeyhole, RotateCcw } from 'lucide-react'

import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/model/cart'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'
import { formatMoney } from '@/lib/money/format-money'
import { cn } from '@/lib/utils'

type CartDrawerFooterProps = {
  activeCart: CartSummary
  marketParams: { country: string; locale: string }
  onClose: () => void
  shippingSummaryLabel: string
}

function CartMoney({
  className,
  price,
}: {
  className?: string
  price: CartSummary['total']
}) {
  const { market } = useMarket()

  return (
    <span
      className={cn(
        'text-xl leading-none font-normal text-foreground',
        className,
      )}
    >
      {formatMoney(price, market.locale)}
    </span>
  )
}

export function CartDrawerFooter({
  activeCart,
  marketParams,
  onClose,
  shippingSummaryLabel,
}: CartDrawerFooterProps) {
  const { t } = useMarket()

  return (
    <div className="shrink-0 border-t border-border bg-background">
      <div className="space-y-3 px-5 pt-5 pb-5">
        <div className="flex items-center justify-between gap-4 text-sm leading-6 text-muted-foreground">
          <span>{t('cart.subtotal')}</span>
          <CartMoney
            className="text-sm leading-6 text-foreground"
            price={activeCart.itemTotal}
          />
        </div>
        <div className="flex items-center justify-between gap-4 text-sm leading-6 text-muted-foreground">
          <span>{t('cart.shipping')}</span>
          <span className="text-foreground">{shippingSummaryLabel}</span>
        </div>
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between gap-4 text-xl leading-8 font-normal text-foreground">
            <span>{t('cart.total')}</span>
            <CartMoney
              className="text-xl leading-8 font-normal"
              price={activeCart.total}
            />
          </div>
        </div>
        <Link
          className={buttonClassName({
            className:
              'mt-5 min-h-14 w-full border-foreground bg-foreground px-5 text-background hover:bg-foreground/90',
            size: 'lg',
          })}
          onClick={onClose}
          params={{ ...marketParams, id: activeCart.id }}
          search={{ payment_error: undefined, payment_error_code: undefined }}
          to="/$country/$locale/checkout/$id"
        >
          <span>{t('cart.checkout')}</span>
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
        <Link
          className={buttonClassName({
            className:
              'mt-3 min-h-14 w-full border-border bg-transparent px-5 text-foreground hover:bg-muted',
            size: 'lg',
            variant: 'secondary',
          })}
          onClick={onClose}
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
      <div className="text-sm leading-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border px-5 py-4 text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
          {t('checkout.secureCheckout')}
        </span>
        <span className="inline-flex items-center gap-2">
          <RotateCcw aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
          {t('cart.returnsWindow')}
        </span>
      </div>
    </div>
  )
}
