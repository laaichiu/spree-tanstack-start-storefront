import { useRef, useState } from 'react'

import { useCheckoutAddressController } from './address/use-checkout-address-controller'
import { useCheckoutReadyStateErrors } from './use-checkout-ready-state-errors'
import { useCheckoutSubmitFlow } from './completion/use-checkout-submit-flow'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type {
  CheckoutCompletionErrorCode,
  CheckoutOrder,
} from '@/lib/checkout/model/checkout'
import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutPaymentSectionHandle } from './payment/checkout-payment-section'
import { getCheckoutAccountLoginHref } from '@/lib/checkout/utils/checkout-navigation'
import { getCheckoutSubmitReadiness } from '@/lib/checkout/utils/payment/payment-readiness'
import { getCheckoutPaymentStateKey } from '@/lib/checkout/utils/shipping/shipping-rate-selection'

export type CheckoutReadyStateOptions = {
  cart: CheckoutOrder
  customerEmail?: string | null
  savedAddresses?: Array<CustomerAddress>
  initialPaymentError?: string | null
  initialPaymentErrorCode?: CheckoutCompletionErrorCode | null
  savedPaymentCards?: Array<CustomerCreditCard>
}

export function useCheckoutReadyStateRuntime({
  cart,
  customerEmail = null,
  savedAddresses = [],
  initialPaymentError = null,
  initialPaymentErrorCode = null,
  savedPaymentCards = [],
}: CheckoutReadyStateOptions) {
  const { t } = useMarket()
  const authenticatedCustomerEmail = customerEmail?.trim() || null
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)
  const [isPaymentBusy, setIsPaymentBusy] = useState(false)
  const [isPaymentSetupPending, setIsPaymentSetupPending] = useState(false)
  const [isPaymentReady, setIsPaymentReady] = useState(false)
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false)
  const [pendingPaymentSubmitKey, setPendingPaymentSubmitKey] = useState<
    string | null
  >(null)
  const paymentSectionRef = useRef<CheckoutPaymentSectionHandle | null>(null)
  const pendingPaymentShippingRateRef = useRef<CartShippingRate | null>(null)
  const lastEnsuredShippingRateForPaymentKeyRef = useRef<string | null>(null)
  const {
    checkoutError,
    clearCheckoutSectionError,
    marketRouteParams,
    scrollToCheckoutSection,
    sectionErrors,
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
  } = useCheckoutReadyStateErrors({
    cartId: cart.id,
    initialPaymentError,
    initialPaymentErrorCode,
  })
  const accountLoginHref = getCheckoutAccountLoginHref({
    cartId: cart.id,
    ...marketRouteParams,
  })
  const deliveryRegionLabels = {
    country: t('checkout.country'),
    countryLoadFailed: t('checkout.addressCountriesLoadFailed'),
    countryPlaceholder: t('checkout.selectCountry'),
    loadingStates: t('checkout.loadingStates'),
    state: t('checkout.stateOrProvince'),
    statePlaceholder: t('checkout.selectState'),
    stateTextPlaceholder: t('checkout.stateOrProvince'),
  }
  const paymentStateKey = getCheckoutPaymentStateKey(cart)

  const addressController = useCheckoutAddressController({
    cart,
    customerEmail,
    savedAddresses,
    isCheckoutSubmitting,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    lastEnsuredShippingRateForPaymentKeyRef,
    setPendingPaymentSubmitKey,
    setCheckoutError,
    clearCheckoutSectionError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
    scrollToCheckoutSection,
  })
  const {
    autosave,
    form: addressForm,
    isCheckoutPending,
    persistence,
    shipping,
  } = addressController
  const isPaymentSubmitQueued = Boolean(pendingPaymentSubmitKey)
  const submitReadiness = getCheckoutSubmitReadiness({
    isCheckoutPending,
    isCheckoutSubmitting,
    isPaymentBusy,
    isPaymentSubmitQueued,
  })
  const hasSessionPaymentMethod = cart.paymentMethods.some(
    (method) => method.sessionRequired,
  )
  const { handleSubmitPayment } = useCheckoutSubmitFlow({
    actions: {
      scrollToCheckoutSection,
      setCheckoutError,
      setCheckoutSectionErrorsAndScroll,
      setSingleCheckoutSectionError,
    },
    address: {
      billingForm: addressForm.billingForm,
      billingMode: addressForm.billingMode,
      ensureSelectedCheckoutShippingRate:
        shipping.ensureSelectedCheckoutShippingRate,
      form: addressForm.form,
      handleSyncedBillingFields: addressForm.handleSyncedBillingFields,
      hasSelectedShippingRate: shipping.hasSelectedShippingRate,
      persistBillingAddress: persistence.persistBillingAddress,
      persistCheckoutAddress: persistence.persistCheckoutAddress,
      selectShippingRate: shipping.selectShippingRate,
      selectedShippingRate: shipping.selectedShippingRate,
      syncBillingFormValuesFromDom: addressForm.syncBillingFormValuesFromDom,
      syncDeliveryFormValuesFromDom: addressForm.syncDeliveryFormValuesFromDom,
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
      clearAutoSaveAddressTimeout: autosave.clearAutoSaveAddressTimeout,
      isCheckoutPending,
      isShippingPending: shipping.isShippingPending,
      setIsCheckoutSubmitting,
      setPendingPaymentSubmitKey,
    },
  })

  return {
    accountLoginHref,
    address: addressController,
    authenticatedCustomerEmail,
    cart,
    checkoutError,
    deliveryRegionLabels,
    handleSubmitPayment,
    hasSessionPaymentMethod,
    isCheckoutSubmitting,
    isMobileSummaryOpen,
    isPaymentBusy,
    isPaymentSubmitQueued,
    isSubmitDisabled: !submitReadiness.ready || cart.amountDue === null,
    onMobileSummaryToggle: () =>
      setIsMobileSummaryOpen((currentOpen) => !currentOpen),
    onPaymentBusyChange: setIsPaymentBusy,
    onPaymentReadyChange: setIsPaymentReady,
    onPaymentSetupPendingChange: setIsPaymentSetupPending,
    paymentSectionRef,
    savedAddresses,
    savedPaymentCards,
    sectionErrors,
  }
}
