import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { useMemo } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import {
  getExpressCheckoutAmount,
  getCheckoutExpressCheckoutState,
} from '@/lib/checkout/utils/express/express-checkout'
import { isStripeConfigured, stripePromise } from '@/lib/stripe/client'
import { CheckoutExpressCheckoutView } from '@/components/checkout/checkout-express-checkout-view'

import { useExpressCheckoutFlow } from './use-express-checkout-flow'

function ExpressCheckoutInner({ cart }: { cart: CheckoutOrder }) {
  const { t } = useMarket()
  const {
    available,
    error,
    handleClick,
    handleConfirm,
    handleReady,
    handleShippingAddressChange,
    handleShippingRateChange,
    processing,
    stripeMethod,
  } = useExpressCheckoutFlow({ cart })

  if (!stripeMethod || available === false) {
    return null
  }

  return (
    <CheckoutExpressCheckoutView
      model={{
        error,
        isLoading: available === null,
        isProcessing: processing,
        isReady: available === true,
        orLabel: t('checkout.or'),
        processingLabel: t('checkout.finalizingExpressCheckout'),
        title: t('checkout.expressCheckout'),
      }}
      slots={{
        paymentElement: (
          <ExpressCheckoutElement
            onClick={handleClick}
            onConfirm={handleConfirm}
            onReady={handleReady}
            onShippingAddressChange={handleShippingAddressChange}
            onShippingRateChange={handleShippingRateChange}
            options={{
              buttonHeight: 40,
              buttonTheme: {
                applePay: 'black',
                googlePay: 'black',
              },
              buttonType: {
                applePay: 'check-out',
                googlePay: 'checkout',
              },
              emailRequired: true,
              layout: {
                maxColumns: 2,
                maxRows: 2,
              },
              paymentMethods: {
                applePay: 'auto',
                googlePay: 'auto',
                link: 'auto',
              },
              phoneNumberRequired: true,
              shippingAddressRequired: true,
            }}
          />
        ),
      }}
    />
  )
}

function CheckoutExpressCheckoutWithElements({
  cart,
}: {
  cart: CheckoutOrder
}) {
  const initialAmount = getExpressCheckoutAmount(cart)
  const options = useMemo<StripeElementsOptions>(
    () => ({
      amount: initialAmount ?? 0,
      currency: cart.currencyCode.toLowerCase(),
      mode: 'payment',
      paymentMethodCreation: 'manual',
    }),
    [cart.currencyCode, initialAmount],
  )

  if (initialAmount === null) {
    return null
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <ExpressCheckoutInner cart={cart} />
    </Elements>
  )
}

export function getExpressCheckoutElementsKey({
  amount,
  cartId,
  currencyCode,
}: {
  amount: number
  cartId: string
  currencyCode: string
}) {
  return [cartId, currencyCode, amount].join(':')
}

export function CheckoutExpressCheckout({
  cart,
  enabled = true,
}: {
  cart: CheckoutOrder
  enabled?: boolean
}) {
  if (!enabled) {
    return null
  }

  const state = getCheckoutExpressCheckoutState({
    amountDue: cart.amountDue?.amount ?? null,
    currencyCode: cart.currencyCode,
    hasWalletAction: true,
    paymentMethods: cart.paymentMethods,
    stripeConfigured: isStripeConfigured,
  })

  if (state.status !== 'ready') {
    return null
  }

  return (
    <CheckoutExpressCheckoutWithElements
      cart={cart}
      key={getExpressCheckoutElementsKey({
        amount: getExpressCheckoutAmount(cart) ?? 0,
        cartId: cart.id,
        currencyCode: cart.currencyCode,
      })}
    />
  )
}
