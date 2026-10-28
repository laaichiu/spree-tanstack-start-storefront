import { useCallback, useRef, useState } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { useCheckoutAddressController } from '@/lib/checkout/client/use-checkout-address-controller'
import { useCheckoutSubmitFlow } from '@/lib/checkout/client/use-checkout-submit-flow'
import type {
  CustomerAddress,
  CustomerCreditCard,
} from '@/lib/account/contracts'
import type { CartShippingRate } from '@/lib/cart/contracts'
import {
  getCheckoutPaymentStateKey,
  getCheckoutSubmitReadiness,
} from '@/lib/checkout/contracts'
import type {
  CheckoutOrder,
  CheckoutRequirementSection,
} from '@/lib/checkout/contracts'
import type { CheckoutCompletionErrorCode } from '@/lib/checkout/utils/completion/checkout-completion-contract'
import { useCheckoutReadyStateErrors } from '@/lib/checkout/client/use-checkout-ready-state-errors'
import {
  getCheckoutRouteNavigation,
  getConfirmPaymentRouteNavigation,
  getOrderPlacedRouteNavigation,
} from '@/lib/checkout/utils/checkout-navigation'
import { useMarket } from '@/components/layout/market-provider'
import {
  getCheckoutMutationKey,
  getCheckoutMutationScopeId,
} from '@/lib/checkout/client/checkout-mutation'
import type { CheckoutPaymentSectionHandle } from './payment/checkout-payment-section'
import { useCheckoutSummary } from '@/components/checkout/use-checkout-summary'
import { getCheckoutSectionElementId } from '@/components/checkout/checkout-requirements'

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
  const navigate = useNavigate()
  const { market, t } = useMarket()
  const isCheckoutMutationPending =
    useIsMutating({
      mutationKey: getCheckoutMutationKey({ cartId: cart.id, market }),
    }) > 0
  const scrollToCheckoutSection = useCallback(
    (section: CheckoutRequirementSection) => {
      window.requestAnimationFrame(() => {
        document
          .getElementById(getCheckoutSectionElementId(section))
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      })
    },
    [],
  )
  const navigateToCheckout = useCallback(
    (cartId = cart.id) =>
      navigate(
        getCheckoutRouteNavigation({
          cartId,
          country: market.country,
          locale: market.locale,
        }),
      ),
    [cart.id, market.country, market.locale, navigate],
  )
  const navigateToConfirmPayment = useCallback(
    (cartId: string, sessionId?: string) =>
      navigate(
        getConfirmPaymentRouteNavigation({
          cartId,
          country: market.country,
          locale: market.locale,
          sessionId,
        }),
      ),
    [market.country, market.locale, navigate],
  )
  const navigateToOrderPlaced = useCallback(
    (orderId: string) =>
      navigate(
        getOrderPlacedRouteNavigation({
          country: market.country,
          locale: market.locale,
          orderId,
        }),
      ),
    [market.country, market.locale, navigate],
  )
  const authenticatedCustomerEmail = customerEmail?.trim() || null
  const [isPaymentBusy, setIsPaymentBusy] = useState(false)
  const [isPaymentSetupPending, setIsPaymentSetupPending] = useState(false)
  const [canAttemptPaymentSubmit, setCanAttemptPaymentSubmit] = useState(false)
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false)
  const [pendingPaymentSubmitKey, setPendingPaymentSubmitKey] = useState<
    string | null
  >(null)
  const paymentSectionRef = useRef<CheckoutPaymentSectionHandle | null>(null)
  const mobileSummary = useCheckoutSummary()
  const pendingPaymentShippingRateRef = useRef<CartShippingRate | null>(null)
  const lastEnsuredShippingRateForPaymentKeyRef = useRef<string | null>(null)
  const {
    checkoutError,
    clearCheckoutSectionError,
    sectionErrors,
    setCheckoutError,
    setCheckoutSectionErrorsAndScroll,
    setSingleCheckoutSectionError,
  } = useCheckoutReadyStateErrors({
    checkoutContextKey: getCheckoutMutationScopeId({
      cartId: cart.id,
      market,
    }),
    initialPaymentError,
    initialPaymentErrorCode,
    navigateToCheckout,
    scrollToCheckoutSection,
    t,
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
    market,
    savedAddresses,
    t,
    navigateToCheckout,
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
    isCheckoutPending: addressCheckoutPending,
    persistence,
    shipping,
  } = addressController
  const isCheckoutPending = addressCheckoutPending || isCheckoutMutationPending
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
    navigateToConfirmPayment,
    navigateToCheckout,
    navigateToOrderPlaced,
    payment: {
      isPaymentBusy,
      canAttemptPaymentSubmit,
      isPaymentSetupPending,
      paymentSectionRef,
      paymentStateKey,
      market: {
        country: market.country,
        locale: market.locale,
      },
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
    t,
  })

  return {
    accountLoginTarget: { cartId: cart.id },
    address: addressController,
    authenticatedCustomerEmail,
    cart,
    checkoutError,
    deliveryRegionLabels,
    handleSubmitPayment,
    hasSessionPaymentMethod,
    isCheckoutMutationPending,
    isCheckoutSubmitting,
    isMobileSummaryOpen: mobileSummary.isMobileOpen,
    isPaymentBusy,
    isPaymentSubmitQueued,
    isSubmitDisabled: !submitReadiness.ready || cart.amountDue === null,
    onMobileSummaryToggle: mobileSummary.toggleMobile,
    onPaymentBusyChange: setIsPaymentBusy,
    onPaymentSubmitReadyChange: setCanAttemptPaymentSubmit,
    onPaymentSetupPendingChange: setIsPaymentSetupPending,
    paymentSectionRef,
    savedAddresses,
    savedPaymentCards,
    sectionErrors,
  }
}
