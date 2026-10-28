import { useEffect, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'
import { readCheckoutMutationErrorMessage } from '../utils/checkout-error'
import { getPendingCheckoutPaymentSubmitAction } from '../utils/payment/payment-submit-queue'

export function useCheckoutPaymentSubmitQueue({
  canAttemptPaymentSubmit,
  cart,
  market,
  hasSelectedShippingRate,
  isCheckoutPending,
  isPaymentBusy,
  isPaymentSetupPending,
  isShippingPending,
  paymentStateKey,
  pendingPaymentShippingRateRef,
  pendingPaymentSubmitKey,
  selectShippingRate,
  setCheckoutError,
  setPendingPaymentSubmitKey,
  setSingleCheckoutSectionError,
  submitRenderedPayment,
  t,
}: {
  canAttemptPaymentSubmit: boolean
  cart: CheckoutOrder
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  hasSelectedShippingRate: boolean
  isCheckoutPending: boolean
  isPaymentBusy: boolean
  isPaymentSetupPending: boolean
  isShippingPending: boolean
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  pendingPaymentSubmitKey: string | null
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
  setCheckoutError: (error: string | null) => void
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  submitRenderedPayment: () => Promise<void>
  t: (key: MessageKey) => string
}) {
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const paymentQueueContextRef = useRef({
    cartId: cart.id,
    country: market.country,
    generation: 0,
    locale: market.locale,
    paymentStateKey,
  })
  const pendingPaymentIntentRef = useRef<{
    key: string
    sourcePaymentStateKey: string
  } | null>(
    pendingPaymentSubmitKey
      ? { key: pendingPaymentSubmitKey, sourcePaymentStateKey: paymentStateKey }
      : null,
  )
  const previousPendingPaymentSubmitKeyRef = useRef(pendingPaymentSubmitKey)

  if (pendingPaymentSubmitKey !== previousPendingPaymentSubmitKeyRef.current) {
    pendingPaymentIntentRef.current = pendingPaymentSubmitKey
      ? { key: pendingPaymentSubmitKey, sourcePaymentStateKey: paymentStateKey }
      : null
    previousPendingPaymentSubmitKeyRef.current = pendingPaymentSubmitKey
  }

  useEffect(() => {
    const previousContext = paymentQueueContextRef.current
    const cartMarketChanged =
      previousContext.cartId !== cart.id ||
      previousContext.country !== market.country ||
      previousContext.locale !== market.locale

    if (cartMarketChanged) {
      paymentQueueContextRef.current = {
        cartId: cart.id,
        country: market.country,
        generation: previousContext.generation + 1,
        locale: market.locale,
        paymentStateKey,
      }
      pendingPaymentIntentRef.current = null
      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      return
    }

    if (previousContext.paymentStateKey !== paymentStateKey) {
      paymentQueueContextRef.current = {
        ...previousContext,
        generation: previousContext.generation + 1,
        paymentStateKey,
      }
    }

    const queueGeneration = paymentQueueContextRef.current.generation
    const pendingPaymentIntent = pendingPaymentIntentRef.current

    if (
      pendingPaymentSubmitKey &&
      pendingPaymentIntent?.key === pendingPaymentSubmitKey &&
      paymentStateKey !== pendingPaymentSubmitKey &&
      paymentStateKey !== pendingPaymentIntent.sourcePaymentStateKey
    ) {
      pendingPaymentIntentRef.current = null
      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      return
    }

    const action = getPendingCheckoutPaymentSubmitAction({
      canAttemptPaymentSubmit,
      hasSelectedShippingRate,
      isCheckoutPending,
      isPaymentBusy,
      isPaymentSetupPending,
      isShippingPending,
      paymentStateKey,
      pendingPaymentShippingRate: pendingPaymentShippingRateRef.current,
      pendingPaymentSubmitKey,
      shippingRates: cart.shippingRates,
    })

    if (action.type === 'idle' || action.type === 'wait') {
      return
    }

    if (action.type === 'select_shipping_rate') {
      void selectShippingRate(action.rate).catch((error) => {
        if (
          !isMountedRef.current ||
          paymentQueueContextRef.current.generation !== queueGeneration
        ) {
          return
        }

        pendingPaymentShippingRateRef.current = null
        setPendingPaymentSubmitKey(null)
        const message = readCheckoutMutationErrorMessage(
          error,
          t('checkout.shippingMethodSaveFailed'),
        )

        setCheckoutError(message)
        setSingleCheckoutSectionError('shipping', message)
      })

      return
    }

    if (action.type === 'shipping_rate_missing') {
      const message = t('checkout.selectShippingBeforePayment')

      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      setCheckoutError(message)
      setSingleCheckoutSectionError('shipping', message)
      return
    }

    if (action.type === 'payment_details_changed') {
      const message = t('checkout.paymentDetailsChanged')

      pendingPaymentShippingRateRef.current = null
      setPendingPaymentSubmitKey(null)
      setCheckoutError(message)
      setSingleCheckoutSectionError('payment', message)
      return
    }

    pendingPaymentShippingRateRef.current = null
    setPendingPaymentSubmitKey(null)
    void submitRenderedPayment().catch((error) => {
      if (
        !isMountedRef.current ||
        paymentQueueContextRef.current.generation !== queueGeneration
      ) {
        return
      }

      const message = readCheckoutMutationErrorMessage(
        error,
        t('checkout.paymentSubmitFailed'),
      )

      setCheckoutError(message)
      setSingleCheckoutSectionError('payment', message)
    })
  }, [
    canAttemptPaymentSubmit,
    cart.id,
    cart.shippingRates,
    hasSelectedShippingRate,
    isCheckoutPending,
    isPaymentBusy,
    isPaymentSetupPending,
    isShippingPending,
    market.country,
    market.locale,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    pendingPaymentSubmitKey,
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    submitRenderedPayment,
    t,
  ])
}
