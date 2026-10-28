import { Link } from '@tanstack/react-router'

import { getCartDrawerFooterPresentation } from '@/components/cart/cart-drawer-footer-display'
import { useMarket } from '@/components/layout/market-provider'
import type {
  CartShippingSummary,
  CartSummaryAmounts,
} from '@/lib/cart/contracts'
import { CartDrawerFooterView } from '@/components/cart/cart-drawer-footer-view'

type CartDrawerFooterProps = {
  amounts: CartSummaryAmounts
  cartId: string
  marketParams: { country: string; locale: string }
  onClose: () => void
  shippingSummary: CartShippingSummary
}

export function CartDrawerFooter({
  amounts,
  cartId,
  marketParams,
  onClose,
  shippingSummary,
}: CartDrawerFooterProps) {
  const { market, t } = useMarket()
  const model = {
    ...getCartDrawerFooterPresentation({
      amounts,
      labels: {
        calculatedAtCheckout: t('cart.calculatedAtCheckout'),
        free: t('cart.free'),
      },
      locale: market.locale,
      shippingSummary,
    }),
    labels: {
      checkout: t('cart.checkout'),
      returnsWindow: t('cart.returnsWindow'),
      secureCheckout: t('checkout.secureCheckout'),
      shipping: t('cart.shipping'),
      subtotal: t('cart.subtotal'),
      total: t('cart.total'),
    },
  }

  return (
    <CartDrawerFooterView
      model={model}
      renderCheckoutLink={(content, className) => (
        <Link
          className={className}
          onClick={onClose}
          params={{ ...marketParams, id: cartId }}
          search={{ payment_error: undefined, payment_error_code: undefined }}
          to="/$country/$locale/checkout/$id"
        >
          {content}
        </Link>
      )}
    />
  )
}
