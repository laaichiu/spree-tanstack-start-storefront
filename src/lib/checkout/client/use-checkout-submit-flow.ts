import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
  CheckoutOrder,
  CheckoutRequirementSection,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
  EnsureCheckoutShippingRate,
  PersistCheckoutAddress,
  PersistCheckoutBillingAddress,
} from './use-checkout-address-controller'
import { getCheckoutMutationScopeId } from './checkout-mutation'
import { useCheckoutPaymentCompletion } from './use-checkout-payment-completion'
import type { CheckoutPaymentSubmitter } from './use-checkout-payment-completion'
import { useCheckoutPaymentSubmitQueue } from './use-checkout-payment-submit-queue'
import { useCheckoutSubmitAction } from './completion/use-checkout-submit-action'
import { useCheckoutSubmitPreparation } from './completion/use-checkout-submit-preparation'
import type { MessageKey } from '../../i18n/messages'

type CheckoutSubmitAddressOptions = {
  form: UseFormReturn<CheckoutAddressInput>
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: CheckoutBillingAddressMode
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
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  paymentSectionRef: RefObject<CheckoutPaymentSubmitter | null>
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  pendingPaymentSubmitKey: string | null
  isPaymentBusy: boolean
  canAttemptPaymentSubmit: boolean
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
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
}

export type CheckoutSubmitFlowOptions = {
  actions: CheckoutSubmitActions
  address: CheckoutSubmitAddressOptions
  cart: CheckoutOrder
  navigateToConfirmPayment: (
    cartId: string,
    sessionId?: string,
  ) => Promise<void>
  navigateToCheckout: (cartId: string) => Promise<void>
  navigateToOrderPlaced: (orderId: string) => Promise<void>
  payment: CheckoutSubmitPaymentOptions
  runtime: CheckoutSubmitRuntimeOptions
  t: (key: MessageKey) => string
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
  navigateToConfirmPayment,
  navigateToCheckout,
  navigateToOrderPlaced,
  payment: {
    market,
    isPaymentBusy,
    canAttemptPaymentSubmit,
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
  t,
}: CheckoutSubmitFlowOptions) {
  const submitRenderedPayment = useCheckoutPaymentCompletion({
    cartId: cart.id,
    navigateToConfirmPayment,
    navigateToOrderPlaced,
    paymentSectionRef,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  })

  useCheckoutPaymentSubmitQueue({
    cart,
    market,
    hasSelectedShippingRate,
    isCheckoutPending,
    isPaymentBusy,
    canAttemptPaymentSubmit,
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
    t,
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
    t,
  })

  const handleSubmitPayment = useCheckoutSubmitAction({
    actions: {
      setCheckoutError,
      setCheckoutSectionErrorsAndScroll,
      setSingleCheckoutSectionError,
    },
    checkoutContextKey: getCheckoutMutationScopeId({
      cartId: cart.id,
      market,
    }),
    pendingPaymentShippingRateRef,
    preparePaymentSubmission,
    navigateToCheckout,
    t,
    runtime: {
      clearAutoSaveAddressTimeout,
      setIsCheckoutSubmitting,
      setPendingPaymentSubmitKey,
    },
    submitRenderedPayment,
  })

  return {
    handleSubmitPayment,
  }
}
