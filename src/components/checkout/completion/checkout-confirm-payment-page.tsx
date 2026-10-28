import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutPaymentReturnSearch } from '@/lib/checkout/utils/completion/payment-return'
import { CheckoutConfirmPaymentPageView } from '@/components/checkout/checkout-confirm-payment-page-view'
import { useCheckoutConfirmPaymentController } from './use-checkout-confirm-payment-controller'

export function CheckoutConfirmPaymentPage({
  cartId,
  country,
  locale,
  paymentReturn,
}: {
  cartId: string
  country: string
  locale: string
  paymentReturn: CheckoutPaymentReturnSearch
}) {
  const { t } = useMarket()
  const error = useCheckoutConfirmPaymentController({
    cartId,
    country,
    locale,
    paymentReturn,
  })

  return (
    <CheckoutConfirmPaymentPageView
      capabilities={{
        renderReturnLink: (content, className) => (
          <Link
            className={className}
            params={{ country, id: cartId, locale }}
            search={{ payment_error: undefined, payment_error_code: undefined }}
            to="/$country/$locale/checkout/$id"
          >
            {content}
          </Link>
        ),
      }}
      model={{
        confirmingDescription: t('checkout.confirmPaymentDescription'),
        confirmingTitle: t('checkout.confirmingPayment'),
        error,
        errorTitle: t('checkout.paymentConfirmationFailed'),
        returnLabel: t('checkout.returnToCheckout'),
      }}
    />
  )
}
