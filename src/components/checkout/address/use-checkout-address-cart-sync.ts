import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import { preservePendingCheckoutEmail } from '@/lib/checkout/utils/address/address-update'
import { getSelectedCheckoutSavedAddressId } from '@/lib/checkout/utils/address/saved-address-selection'

import type { CheckoutSectionErrors } from '../checkout-requirements'

type CheckoutAddressCartSyncOptions = {
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  cart: CheckoutOrder
  form: UseFormReturn<CheckoutAddressInput>
  initialBillingAddressValues: CheckoutBillingAddressInput
  initialShippingAddressValues: CheckoutAddressInput
  resetAddressPersistence: () => void
  savedAddresses: Array<CustomerAddress>
  setAddressBillingMode: (mode: 'same' | 'different') => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSelectedSavedAddressId: (addressId: string | null) => void
}

export function useCheckoutAddressCartSync({
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
}: CheckoutAddressCartSyncOptions) {
  const lastInitializedCartIdRef = useRef(cart.id)

  useEffect(() => {
    if (lastInitializedCartIdRef.current === cart.id) {
      return
    }

    const nextShippingAddressValues = preservePendingCheckoutEmail({
      currentValues: form.getValues(),
      nextValues: initialShippingAddressValues,
    })

    lastInitializedCartIdRef.current = cart.id
    form.reset(nextShippingAddressValues)
    billingForm.reset(initialBillingAddressValues)
    setAddressBillingMode(
      cart.billingAddress && !cart.shippingMatchesBillingAddress
        ? 'different'
        : 'same',
    )
    resetAddressPersistence()
    setCheckoutSectionErrorsAndScroll({})
    setSelectedSavedAddressId(
      getSelectedCheckoutSavedAddressId({
        savedAddresses,
        shippingAddress: cart.shippingAddress,
      }),
    )
  }, [
    billingForm,
    cart.billingAddress,
    cart.id,
    cart.shippingAddress,
    cart.shippingMatchesBillingAddress,
    form,
    initialBillingAddressValues,
    initialShippingAddressValues,
    resetAddressPersistence,
    savedAddresses,
    setAddressBillingMode,
    setCheckoutSectionErrorsAndScroll,
    setSelectedSavedAddressId,
  ])
}
