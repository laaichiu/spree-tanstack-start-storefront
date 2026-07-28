import { useCallback, useRef } from 'react'
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'
import { useCheckoutAddressForm } from './use-checkout-address-form'
import { useCheckoutAddressPersistence } from './use-checkout-address-persistence'
import { useCheckoutShippingRate } from '../shipping/use-checkout-shipping-rate'
import type { EnsureCheckoutShippingRate } from '../shipping/use-checkout-shipping-rate'
import type {
  CheckoutSectionErrorKey,
  CheckoutSectionErrors,
} from '../checkout-requirements'
import { useCheckoutAddressAutosaveScheduler } from './use-checkout-address-autosave-scheduler'
import { useCheckoutAddressCartSync } from './use-checkout-address-cart-sync'

export type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
} from './use-checkout-address-form'

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
  savedAddresses: Array<CustomerAddress>
  isCheckoutSubmitting: boolean
  paymentStateKey: string
  pendingPaymentShippingRateRef: MutableRefObject<CartShippingRate | null>
  lastEnsuredShippingRateForPaymentKeyRef: MutableRefObject<string | null>
  setPendingPaymentSubmitKey: Dispatch<SetStateAction<string | null>>
  setCheckoutError: (error: string | null) => void
  clearCheckoutSectionError: (section: CheckoutSectionErrorKey) => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
  scrollToCheckoutSection: (section: CheckoutSectionErrorKey) => void
}

export function useCheckoutAddressController({
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
    form,
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
    paymentStateKey,
    pendingPaymentShippingRateRef,
    lastEnsuredShippingRateForPaymentKeyRef,
    setPendingPaymentSubmitKey,
    clearCheckoutSectionError,
    setCheckoutError,
    setSingleCheckoutSectionError,
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
    (mode: 'same' | 'different') => {
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
