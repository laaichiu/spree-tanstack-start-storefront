import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { CircleAlert, Loader2 } from 'lucide-react'
import { useMemo, useRef } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'
import { getExpressCheckoutAmount } from '@/lib/checkout/utils/express/express-checkout'
import { isStripeConfigured, stripePromise } from '@/lib/stripe/client'

import { useExpressCheckoutFlow } from './use-express-checkout-flow'

export type CheckoutExpressCheckoutState =
  | {
      reason: 'no_payment_due'
      status: 'hidden'
    }
  | {
      reason:
        | 'stripe_not_configured'
        | 'stripe_payment_method_missing'
        | 'wallet_action_missing'
      status: 'disabled'
    }
  | {
      reason: null
      status: 'ready'
    }

export function getCheckoutExpressCheckoutState({
  amountDue,
  hasWalletAction,
  paymentMethods,
  stripeConfigured,
}: {
  amountDue: number
  hasWalletAction: boolean
  paymentMethods: CheckoutPaymentMethod[]
  stripeConfigured: boolean
}): CheckoutExpressCheckoutState {
  if (amountDue <= 0) {
    return {
      reason: 'no_payment_due',
      status: 'hidden',
    }
  }

  if (!stripeConfigured) {
    return {
      reason: 'stripe_not_configured',
      status: 'disabled',
    }
  }

  const hasStripeSessionPaymentMethod = paymentMethods.some(
    (method) => method.gatewayId === 'stripe' && method.sessionRequired,
  )

  if (!hasStripeSessionPaymentMethod) {
    return {
      reason: 'stripe_payment_method_missing',
      status: 'disabled',
    }
  }

  if (!hasWalletAction) {
    return {
      reason: 'wallet_action_missing',
      status: 'disabled',
    }
  }

  return {
    reason: null,
    status: 'ready',
  }
}

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
    <section className="space-y-3" data-testid="checkout-express-checkout">
      <p className="text-center text-lg leading-none text-muted-foreground">
        {t('checkout.expressCheckout')}
      </p>
      <div className="relative">
        {processing ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90">
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-muted-foreground"
            />
            <p className="mt-3 text-sm leading-5 text-muted-foreground">
              {t('checkout.finalizingExpressCheckout')}
            </p>
          </div>
        ) : null}
        <div className={available === null ? 'min-h-10' : undefined}>
          {available === null ? (
            <div className="flex h-10 items-center justify-center border border-border bg-background">
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-muted-foreground"
              />
            </div>
          ) : null}
          <div
            className={
              available === true && !processing ? 'opacity-100' : 'opacity-0'
            }
          >
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
          </div>
        </div>
      </div>
      {available === true ? (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-sm leading-none text-muted-foreground uppercase">
            {t('checkout.or')}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      {error ? (
        <div className="border border-destructive bg-muted px-4 py-3">
          <p className="flex items-center gap-2 text-sm leading-5 text-destructive">
            <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            {error}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function CheckoutExpressCheckoutWithElements({
  cart,
}: {
  cart: CheckoutOrder
}) {
  const initialAmountRef = useRef(getExpressCheckoutAmount(cart))
  const currencyRef = useRef(cart.currencyCode.toLowerCase())
  const options = useMemo<StripeElementsOptions>(
    () => ({
      amount: initialAmountRef.current,
      currency: currencyRef.current,
      mode: 'payment',
      paymentMethodCreation: 'manual',
    }),
    [],
  )

  return (
    <Elements options={options} stripe={stripePromise}>
      <ExpressCheckoutInner cart={cart} />
    </Elements>
  )
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
    amountDue: cart.amountDue.amount,
    hasWalletAction: true,
    paymentMethods: cart.paymentMethods,
    stripeConfigured: isStripeConfigured,
  })

  if (state.status !== 'ready') {
    return null
  }

  return <CheckoutExpressCheckoutWithElements cart={cart} />
}
