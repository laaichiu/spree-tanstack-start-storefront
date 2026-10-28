import { Link, useNavigate } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import {
  CheckoutLoadErrorStateView,
  CheckoutLoadingStateView,
  CheckoutUnavailableStateView,
} from '@/components/checkout/checkout-entry-states-view'
import { CheckoutPageView } from '@/components/checkout/checkout-page-view'
import { useMarket } from '@/components/layout/market-provider'
import type {
  CustomerAddress,
  CustomerCreditCard,
} from '@/lib/account/contracts'
import type { CartSummary } from '@/lib/cart/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { CheckoutCompletionErrorCode } from '@/lib/checkout/utils/completion/checkout-completion-contract'
import { useCheckoutEntryStateRuntime } from '@/lib/checkout/client/use-checkout-entry-state'

import { CheckoutReadyStateController } from './checkout-ready-state-controller'

type CheckoutEntryStateProps = {
  cartId?: string
  initialCart?: CartSummary | CheckoutOrder | null
  initialCartLoadError?: string | null
  initialCustomerEmail?: string | null
  initialPaymentError?: string | null
  initialPaymentErrorCode?: CheckoutCompletionErrorCode | null
  initialSavedAddresses?: Array<CustomerAddress>
  initialSavedPaymentCards?: Array<CustomerCreditCard>
}

export function CheckoutEntryState({
  cartId,
  initialCart,
  initialCartLoadError,
  initialCustomerEmail,
  initialPaymentError,
  initialPaymentErrorCode,
  initialSavedAddresses,
  initialSavedPaymentCards,
}: CheckoutEntryStateProps) {
  const navigate = useNavigate()
  const { market, t } = useMarket()
  const { cartLoadErrorMessage, isResetPending, page, recoverCheckoutSession } =
    useCheckoutEntryStateRuntime({
      cartId,
      cartLoadErrorFallback: t('cart.cartLoadFailedDescription'),
      initialCart,
      initialCartLoadError,
      market,
      navigateToCheckout: () =>
        navigate({
          params: {
            country: market.country,
            locale: market.locale,
          },
          replace: true,
          to: '/$country/$locale/checkout',
        }),
    })
  const pageStatus = page.status

  if (pageStatus === 'loading') {
    return (
      <CheckoutLoadingStateView
        model={{ message: t('checkout.loadingCheckout') }}
      />
    )
  }

  if (pageStatus === 'error') {
    return (
      <CheckoutLoadErrorStateView
        model={{
          errorMessage: cartLoadErrorMessage,
          errorTitle: t('checkout.checkoutLoadFailed'),
          isResetPending,
          resetLabel: t('cart.resetCartSession'),
          resettingLabel: t('cart.resettingCartSession'),
        }}
        onReset={recoverCheckoutSession}
      />
    )
  }

  if (pageStatus !== 'ready') {
    return (
      <CheckoutUnavailableStateView
        capabilities={{
          renderProductsLink: (content, className) => (
            <Link
              className={className}
              params={{ country: market.country, locale: market.locale }}
              search={DEFAULT_PRODUCT_LISTING_SEARCH}
              to="/$country/$locale/products"
            >
              {content}
            </Link>
          ),
        }}
        model={{
          description: t('checkout.checkoutUnavailableDescription'),
          eyebrow: t('checkout.checkout'),
          shopAllProductsLabel: t('cart.shopAllProducts'),
          title: t('checkout.checkoutUnavailable'),
        }}
      />
    )
  }

  return (
    <CheckoutReadyStateController
      cart={page.order}
      customerEmail={initialCustomerEmail}
      initialPaymentError={initialPaymentError}
      initialPaymentErrorCode={initialPaymentErrorCode}
      savedAddresses={initialSavedAddresses}
      savedPaymentCards={initialSavedPaymentCards}
    >
      {(controller) => (
        <CheckoutPageView
          error={controller.error}
          slots={{
            delivery: controller.delivery,
            express: controller.express,
            payment: controller.payment,
            submit: controller.submit,
            summary: controller.summary,
          }}
        />
      )}
    </CheckoutReadyStateController>
  )
}
