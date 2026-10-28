import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { CustomerAddress } from '@/lib/account/contracts'
import type {
  CheckoutOrder,
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/contracts'
import {
  CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES,
  getCheckoutAddressFormDefaults,
  getCheckoutBillingAddressFormDefaults,
  getCheckoutBillingAddressMode,
  getSelectedCheckoutSavedAddressId,
  mergeCheckoutAddressCompletenessValues,
} from '@/lib/checkout/contracts'
import {
  checkoutAddressSchema,
  checkoutBillingAddressSchema,
} from '../validation/address'

type CheckoutAddressFormStateOptions = {
  cart: CheckoutOrder
  customerEmail: string | null
  fallbackCountryIso: string
  savedAddresses: Array<CustomerAddress>
}

export function useCheckoutAddressFormState({
  cart,
  customerEmail,
  fallbackCountryIso,
  savedAddresses,
}: CheckoutAddressFormStateOptions) {
  const authenticatedCustomerEmail = customerEmail?.trim() || null
  const normalizedFallbackCountryIso = fallbackCountryIso.toUpperCase()
  const initialShippingAddressValues = getCheckoutAddressFormDefaults({
    address: cart.shippingAddress,
    email: cart.email || authenticatedCustomerEmail,
    fallbackCountryIso: normalizedFallbackCountryIso,
  })
  const initialBillingAddressValues = getCheckoutBillingAddressFormDefaults({
    address:
      cart.billingAddress ??
      (cart.shippingMatchesBillingAddress ? cart.shippingAddress : null),
    fallbackCountryIso: normalizedFallbackCountryIso,
  })
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    string | null
  >(() =>
    getSelectedCheckoutSavedAddressId({
      savedAddresses,
      shippingAddress: cart.shippingAddress,
    }),
  )
  const [billingMode, setBillingMode] = useState(() =>
    getCheckoutBillingAddressMode({
      billingAddress: cart.billingAddress,
      shippingMatchesBillingAddress: cart.shippingMatchesBillingAddress,
    }),
  )
  const deliveryFormRef = useRef<HTMLFormElement | null>(null)
  const billingFieldsRef = useRef<HTMLDivElement | null>(null)
  const form = useForm<CheckoutAddressInput>({
    defaultValues: initialShippingAddressValues,
    resolver: zodResolver(checkoutAddressSchema),
  })
  const billingForm = useForm<CheckoutBillingAddressInput>({
    defaultValues: initialBillingAddressValues,
    resolver: zodResolver(checkoutBillingAddressSchema),
  })
  const deliveryCompletenessValues = useWatch({
    control: form.control,
    name: CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES,
  })
  const [
    address1,
    city,
    countryIso,
    email,
    firstName,
    lastName,
    phone,
    postalCode,
    stateAbbr,
    stateName,
  ] = deliveryCompletenessValues
  const billingCountryIso = useWatch({
    control: billingForm.control,
    name: 'countryIso',
  })
  const billingStateAbbr = useWatch({
    control: billingForm.control,
    name: 'stateAbbr',
  })
  const billingStateName = useWatch({
    control: billingForm.control,
    name: 'stateName',
  })
  const isDeliveryAddressComplete = useMemo(
    () =>
      checkoutAddressSchema.safeParse(
        mergeCheckoutAddressCompletenessValues(
          form.getValues(),
          deliveryCompletenessValues,
        ),
      ).success,
    [
      address1,
      city,
      countryIso,
      email,
      firstName,
      lastName,
      phone,
      postalCode,
      stateAbbr,
      stateName,
    ],
  )

  return {
    billingCountryIso,
    billingFieldsRef,
    billingForm,
    billingMode,
    billingStateAbbr,
    billingStateName,
    countryIso,
    deliveryFormRef,
    form,
    initialBillingAddressValues,
    initialShippingAddressValues,
    isDeliveryAddressComplete,
    selectedSavedAddressId,
    setBillingMode,
    setSelectedSavedAddressId,
    stateAbbr,
    stateName,
  }
}
