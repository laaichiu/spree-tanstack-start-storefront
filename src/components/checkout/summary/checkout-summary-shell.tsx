import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/model/cart'
import { formatMoney } from '@/lib/money/format-money'
import { cn } from '@/lib/utils'

export function CheckoutSummaryShell({
  cart,
  children,
  isMobileOpen,
  onMobileToggle,
}: {
  cart: CartSummary
  children: ReactNode
  isMobileOpen: boolean
  onMobileToggle: () => void
}) {
  const { market, t } = useMarket()

  return (
    <aside className="border-b border-border bg-background text-foreground lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:self-start lg:border-b-0">
      <button
        aria-controls="checkout-mobile-summary"
        aria-expanded={isMobileOpen}
        className={cn(
          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-muted/40 px-6 py-4 text-left focus-visible:focus-ring lg:hidden',
          { 'border-b border-border': isMobileOpen },
        )}
        onClick={onMobileToggle}
        type="button"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm leading-5 font-normal text-foreground">
          <span className="truncate">{t('checkout.orderSummary')}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
              isMobileOpen ? 'rotate-180' : null,
            )}
          />
        </span>
        <span className="text-right text-sm leading-5 font-normal text-foreground">
          {formatMoney(cart.total, market.locale)}
        </span>
      </button>

      <div
        className={cn(isMobileOpen ? 'block' : 'hidden', 'lg:block')}
        id="checkout-mobile-summary"
      >
        <div className="px-6 pt-6 pb-6 lg:mr-auto lg:w-full lg:max-w-checkout lg:px-14 lg:py-12">
          <div className="w-full lg:max-w-checkout">{children}</div>
        </div>
      </div>
    </aside>
  )
}
