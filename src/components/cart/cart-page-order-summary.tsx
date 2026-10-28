import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { getCartSummaryPresentation } from '@/components/cart/cart-summary-display'
import type { CartSummary, CartSummaryAmounts } from '@/lib/cart/contracts'
import { CartOrderSummaryView } from '@/components/cart/cart-order-summary-view'

type CartPageOrderSummaryProps = {
  amounts: CartSummaryAmounts
  cart: CartSummary
}

export function CartPageOrderSummary({
  amounts,
  cart,
}: CartPageOrderSummaryProps) {
  const { market, t } = useMarket()
  const marketParams = { country: market.country, locale: market.locale }

  return (
    <CartOrderSummaryView
      model={{
        ...getCartSummaryPresentation(amounts, market.locale),
        labels: {
          continueShopping: t('cart.continueShopping'),
          discount: t('cart.discount'),
          orderSummary: t('cart.orderSummary'),
          proceedToCheckout: t('cart.proceedToCheckout'),
          returnPolicy: t('footer.returnPolicy'),
          shipping: t('cart.shipping'),
          shippingCalculatedAtCheckout: t('cart.shippingCalculatedAtCheckout'),
          shippingNote: t('cart.shippingNote'),
          shippingPolicy: t('footer.shippingPolicy'),
          subtotal: t('cart.subtotal'),
          tax: t('cart.tax'),
          total: t('cart.total'),
        },
      }}
      renderCheckoutLink={(content, className) => (
        <Link
          className={className}
          params={{ ...marketParams, id: cart.id }}
          search={{ payment_error: undefined, payment_error_code: undefined }}
          to="/$country/$locale/checkout/$id"
        >
          {content}
        </Link>
      )}
      renderContinueShoppingLink={(content, className) => (
        <Link
          className={className}
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {content}
        </Link>
      )}
      renderPolicyLink={(slug, content, className) => (
        <Link
          className={className}
          params={{ ...marketParams, slug }}
          to="/$country/$locale/policies/$slug"
        >
          {content}
        </Link>
      )}
    />
  )
}
