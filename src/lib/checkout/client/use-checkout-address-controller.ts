import { useCallback, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CustomerAddress } from '@/lib/account/contracts'
import type {
  CheckoutOrder,
  CheckoutAddressInput,
  CheckoutBillingAddressMode,
  CheckoutRequirementSection,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'
import type { MessageKey } from '../../i18n/messages'
import { useCheckoutAddressForm } from './address/use-checkout-address-form'
import { useCheckoutAddressPersistence } from './address/use-checkout-address-persistence'
import { useCheckoutShippingRate } from './use-checkout-shipping-rate'
import type { EnsureCheckoutShippingRate } from './use-checkout-shipping-rate'
import { useCheckoutAddressAutosaveScheduler } from './address/use-checkout-address-autosave-scheduler'
import { useCheckoutAddressCartSync } from './address/use-checkout-address-cart-sync'

export type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './address/use-checkout-address-form'
export type PersistCheckoutAddress = (
  address: CheckoutAddressInput,
  options?: { force?: boolean },
) => Promise<CheckoutOrder | null | undefined>

export type PersistCheckoutBillingAddress = (
  currentCart?: CheckoutOrder,
) => Promise<CheckoutOrder | null>

export type { EnsureCheckoutShippingRate }

type CheckoutAddressControllerOptions = {
  cart: CheckoutOrder
  customerEmail: string | null
  market: MarketSelectionInput
  savedAddresses: Array<CustomerAddress>
  t: (key: MessageKey) => string
  navigateToCheckout: (cartId: string) => Promise<void>
  isCheckoutSubmitting: boolean
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setCheckoutError: (error: string | null) => void
  clearCheckoutSectionError: (section: CheckoutRequirementSection) => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  scrollToCheckoutSection: (section: CheckoutRequirementSection) => void
}

export function useCheckoutAddressController({
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
}: CheckoutAddressControllerOptions) {
  const attemptAutoSaveAddressRef = useRef<() => Promise<void>>(
    async () => undefined,
  )
  const shippingRateActionsRef = useRef<{
    markShippingRatesCurrent: () => void
    markShippingRatesStale: () => void
  } | null>(null)

  const { clearAutoSaveAddressTimeout, scheduleAutoSaveAddress } =
    useCheckoutAddressAutosaveScheduler({ attemptAutoSaveAddressRef })

  const markShippingRatesStale = useCallback(() => {
    shippingRateActionsRef.current?.markShippingRatesStale()
  }, [])

  const markShippingRatesCurrent = useCallback(() => {
    shippingRateActionsRef.current?.markShippingRatesCurrent()
  }, [])
  const handleAddressBlur = useCallback(() => {
    clearAutoSaveAddressTimeout()
    void attemptAutoSaveAddressRef.current()
  }, [clearAutoSaveAddressTimeout])

  const addressForm = useCheckoutAddressForm({
    cart,
    customerEmail,
    fallbackCountryIso: market.country,
    savedAddresses,
    clearCheckoutSectionError,
    markShippingRatesStale,
    scheduleAutoSaveAddress,
    handleAddressBlur,
  })
  const {
    billingForm,
    billingMode,
    form,
    initialBillingAddressValues,
    initialShippingAddressValues,
    isDeliveryAddressComplete,
    handleSyncedDeliveryFields,
    setBillingMode: setAddressBillingMode,
    setSelectedSavedAddressId,
    syncDeliveryFormValuesFromDom,
  } = addressForm
  const addressPersistence = useCheckoutAddressPersistence({
    billingForm,
    billingMode,
    cart,
    market,
    form,
    isCheckoutSubmitting,
    initialShippingAddressValues,
    handleSyncedBillingFields: addressForm.handleSyncedBillingFields,
    handleSyncedDeliveryFields,
    markShippingRatesCurrent,
    markShippingRatesStale,
    scrollToCheckoutSection,
    setSelectedSavedAddressId,
    syncBillingFormValuesFromDom: addressForm.syncBillingFormValuesFromDom,
    syncDeliveryFormValuesFromDom,
    clearCheckoutSectionError,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
    navigateToCheckout,
  })
  const {
    attemptAutoSaveAddress,
    handleSaveAddress: persistFormAddress,
    isAddressPending,
    isBillingPending,
    persistBillingAddress,
    persistCheckoutAddress,
    persistCheckoutSavedAddress,
    resetAddressPersistence,
  } = addressPersistence
  attemptAutoSaveAddressRef.current = attemptAutoSaveAddress
  const shippingRate = useCheckoutShippingRate({
    cart,
    isAddressComplete: isDeliveryAddressComplete,
    isAddressPending,
    isCheckoutSubmitting,
    market,
    paymentStateKey,
    pendingPaymentShippingRateRef,
    lastEnsuredShippingRateForPaymentKeyRef,
    setPendingPaymentSubmitKey,
    clearCheckoutSectionError,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  })
  shippingRateActionsRef.current = shippingRate
  const {
    areShippingMethodsUpdating,
    areShippingRatesStale,
    ensureSelectedCheckoutShippingRate,
    handleSelectShippingRate,
    hasCurrentShippingSelection,
    hasSelectedShippingRate,
    isShippingPending,
    selectedShippingRate,
    selectedShippingRateId,
    selectShippingRate,
    shippingMethodPlaceholder,
  } = shippingRate
  const isCheckoutPending =
    isAddressPending || isBillingPending || isShippingPending
  const handleSaveAddress = useCallback(
    async (address: CheckoutAddressInput) => {
      clearAutoSaveAddressTimeout()
      await persistFormAddress(address)
    },
    [persistFormAddress],
  )
  const setBillingMode = useCallback(
    (mode: CheckoutBillingAddressMode) => {
      clearCheckoutSectionError('payment')
      setAddressBillingMode(mode)
    },
    [clearCheckoutSectionError, setAddressBillingMode],
  )

  useCheckoutAddressCartSync({
    billingForm,
    cart,
    form,
    initialBillingAddressValues,
    initialShippingAddressValues,
    market,
    resetAddressPersistence,
    savedAddresses,
    setAddressBillingMode,
    setCheckoutSectionErrorsAndScroll,
    setSelectedSavedAddressId,
  })

  return {
    autosave: {
      clearAutoSaveAddressTimeout,
    },
    form: {
      ...addressForm,
      setBillingMode,
    },
    isCheckoutPending,
    persistence: {
      handleSaveAddress,
      isAddressPending,
      isBillingPending,
      persistBillingAddress,
      persistCheckoutAddress,
      persistCheckoutSavedAddress,
    },
    shipping: {
      areShippingMethodsUpdating,
      areShippingRatesStale,
      ensureSelectedCheckoutShippingRate,
      handleSelectShippingRate,
      hasCurrentShippingSelection,
      hasSelectedShippingRate,
      isShippingPending,
      selectedShippingRate,
      selectedShippingRateId,
      selectShippingRate,
      shippingMethodPlaceholder,
    },
  }
}
