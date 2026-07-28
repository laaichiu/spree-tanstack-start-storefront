import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'
import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from 'react'
import type { UseFormReturn } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'

import type { CheckoutPaymentSectionHandle } from '../payment/checkout-payment-section'
import type {
  CheckoutSectionErrorKey,
  CheckoutSectionErrors,
} from '../checkout-requirements'
import { getCheckoutRouteNavigation } from '@/lib/checkout/utils/checkout-navigation'
import { runCheckoutSubmitFlow } from './checkout-submit-flow'

import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
  EnsureCheckoutShippingRate,
  PersistCheckoutAddress,
  PersistCheckoutBillingAddress,
} from '../address/use-checkout-address-controller'
import { useCheckoutPaymentCompletion } from '../payment/use-checkout-payment-completion'
import { useCheckoutPaymentSubmitQueue } from '../payment/use-checkout-payment-submit-queue'
import { useCheckoutSubmitPreparation } from './use-checkout-submit-preparation'

type CheckoutSubmitAddressOptions = {
  form: UseFormReturn<CheckoutAddressInput>
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: 'same' | 'different'
  selectedShippingRate: CartShippingRate | null
  hasSelectedShippingRate: boolean
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  persistCheckoutAddress: PersistCheckoutAddress
  persistBillingAddress: PersistCheckoutBillingAddress
  ensureSelectedCheckoutShippingRate: EnsureCheckoutShippingRate
  selectShippingRate: (rate: CartShippingRate) => Promise<CheckoutOrder>
}

type CheckoutSubmitPaymentOptions = {
  paymentSectionRef: RefObject<CheckoutPaymentSectionHandle | null>
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  pendingPaymentSubmitKey: string | null
  isPaymentBusy: boolean
  isPaymentReady: boolean
  isPaymentSetupPending: boolean
}

type CheckoutSubmitRuntimeOptions = {
  isCheckoutPending: boolean
  isShippingPending: boolean
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setIsCheckoutSubmitting: Dispatch<SetStateAction<boolean>>
  clearAutoSaveAddressTimeout: () => void
}

type CheckoutSubmitActions = {
  setCheckoutError: (error: string | null) => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
  scrollToCheckoutSection: (section: CheckoutSectionErrorKey) => void
}

type CheckoutSubmitFlowOptions = {
  actions: CheckoutSubmitActions
  address: CheckoutSubmitAddressOptions
  cart: CheckoutOrder
  payment: CheckoutSubmitPaymentOptions
  runtime: CheckoutSubmitRuntimeOptions
}

export function useCheckoutSubmitFlow({
  actions: {
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
    scrollToCheckoutSection,
  },
  address: {
    billingForm,
    billingMode,
    ensureSelectedCheckoutShippingRate,
    form,
    handleSyncedBillingFields,
    hasSelectedShippingRate,
    persistBillingAddress,
    persistCheckoutAddress,
    selectShippingRate,
    selectedShippingRate,
    syncBillingFormValuesFromDom,
    syncDeliveryFormValuesFromDom,
  },
  cart,
  payment: {
    isPaymentBusy,
    isPaymentReady,
    isPaymentSetupPending,
    paymentSectionRef,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    pendingPaymentSubmitKey,
  },
  runtime: {
    clearAutoSaveAddressTimeout,
    isCheckoutPending,
    isShippingPending,
    setIsCheckoutSubmitting,
    setPendingPaymentSubmitKey,
  },
}: CheckoutSubmitFlowOptions) {
  const { market, t } = useMarket()
  const navigate = useNavigate()
  const paymentSubmissionInFlightRef = useRef(false)
  const marketRouteParams = {
    country: market.country,
    locale: market.locale,
  }

  const submitRenderedPayment = useCheckoutPaymentCompletion({
    cartId: cart.id,
    paymentSectionRef,
    setCheckoutError,
    setSingleCheckoutSectionError,
  })

  useCheckoutPaymentSubmitQueue({
    cart,
    hasSelectedShippingRate,
    isCheckoutPending,
    isPaymentBusy,
    isPaymentReady,
    isPaymentSetupPending,
    isShippingPending,
    paymentStateKey,
    pendingPaymentSubmitKey,
    pendingPaymentShippingRateRef,
    selectShippingRate,
    setCheckoutError,
    setPendingPaymentSubmitKey,
    setSingleCheckoutSectionError,
    submitRenderedPayment,
  })

  const preparePaymentSubmission = useCheckoutSubmitPreparation({
    billingForm,
    billingMode,
    cart,
    ensureSelectedCheckoutShippingRate,
    form,
    handleSyncedBillingFields,
    paymentStateKey,
    persistBillingAddress,
    persistCheckoutAddress,
    scrollToCheckoutSection,
    selectedShippingRate,
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
    syncBillingFormValuesFromDom,
    syncDeliveryFormValuesFromDom,
  })

  async function handleSubmitPayment() {
    if (paymentSubmissionInFlightRef.current) {
      return
    }

    paymentSubmissionInFlightRef.current = true
    setIsCheckoutSubmitting(true)
    clearAutoSaveAddressTimeout()
    setCheckoutError(null)
    setCheckoutSectionErrorsAndScroll({})

    try {
      await runCheckoutSubmitFlow({
        navigateToCheckout: (cartId) =>
          navigate(
            getCheckoutRouteNavigation({
              cartId,
              ...marketRouteParams,
            }),
          ),
        pendingPaymentShippingRateRef,
        preparePaymentSubmission,
        setCheckoutError,
        setPendingPaymentSubmitKey,
        submitRenderedPayment,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('checkout.paymentSubmitFailed')

      setCheckoutError(message)
      setSingleCheckoutSectionError('payment', message)
    } finally {
      paymentSubmissionInFlightRef.current = false
      setIsCheckoutSubmitting(false)
    }
  }

  return {
    handleSubmitPayment,
  }
}
