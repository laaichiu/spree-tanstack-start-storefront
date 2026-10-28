import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CustomerAddress } from '@/lib/account/contracts'
import type {
  CheckoutOrder,
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import {
  getSelectedCheckoutSavedAddressId,
  preservePendingCheckoutEmail,
} from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { getCheckoutMutationScopeId } from '../checkout-mutation'

type CheckoutAddressCartSyncOptions = {
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  cart: CheckoutOrder
  form: UseFormReturn<CheckoutAddressInput>
  initialBillingAddressValues: CheckoutBillingAddressInput
  initialShippingAddressValues: CheckoutAddressInput
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  resetAddressPersistence: () => void
  savedAddresses: Array<CustomerAddress>
  setAddressBillingMode: (mode: CheckoutBillingAddressMode) => void
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
  market,
  resetAddressPersistence,
  savedAddresses,
  setAddressBillingMode,
  setCheckoutSectionErrorsAndScroll,
  setSelectedSavedAddressId,
}: CheckoutAddressCartSyncOptions) {
  const lastInitializedContextKeyRef = useRef(
    getCheckoutMutationScopeId({ cartId: cart.id, market }),
  )

  useEffect(() => {
    const contextKey = getCheckoutMutationScopeId({
      cartId: cart.id,
      market,
    })

    if (lastInitializedContextKeyRef.current === contextKey) {
      return
    }

    const nextShippingAddressValues = preservePendingCheckoutEmail({
      currentValues: form.getValues(),
      nextValues: initialShippingAddressValues,
    })

    lastInitializedContextKeyRef.current = contextKey
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
    market,
    resetAddressPersistence,
    savedAddresses,
    setAddressBillingMode,
    setCheckoutSectionErrorsAndScroll,
    setSelectedSavedAddressId,
  ])
}
