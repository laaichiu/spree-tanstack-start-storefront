import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import {
  checkoutAddressSchema,
  checkoutBillingAddressSchema,
} from '@/lib/checkout/validation/address'
import {
  CHECKOUT_ADDRESS_COMPLETENESS_FIELD_NAMES,
  mergeCheckoutAddressCompletenessValues,
} from '@/lib/checkout/utils/address/address-completeness'

import {
  getCheckoutAddressFormDefaults,
  getCheckoutBillingAddressFormDefaults,
} from './checkout-form'
import type { BillingAddressMode } from './checkout-form'
import { getSelectedCheckoutSavedAddressId } from '@/lib/checkout/utils/address/saved-address-selection'

type CheckoutAddressFormStateOptions = {
  cart: CheckoutOrder
  customerEmail: string | null
  savedAddresses: Array<CustomerAddress>
}

export function useCheckoutAddressFormState({
  cart,
  customerEmail,
  savedAddresses,
}: CheckoutAddressFormStateOptions) {
  const { market } = useMarket()
  const fallbackCountryIso = market.country.toUpperCase()
  const authenticatedCustomerEmail = customerEmail?.trim() || null
  const initialShippingAddressValues = getCheckoutAddressFormDefaults({
    address: cart.shippingAddress,
    email: cart.email || authenticatedCustomerEmail,
    fallbackCountryIso,
  })
  const initialBillingAddressValues = getCheckoutBillingAddressFormDefaults({
    address:
      cart.billingAddress ??
      (cart.shippingMatchesBillingAddress ? cart.shippingAddress : null),
    fallbackCountryIso,
  })
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    string | null
  >(() =>
    getSelectedCheckoutSavedAddressId({
      savedAddresses,
      shippingAddress: cart.shippingAddress,
    }),
  )
  const [billingMode, setBillingMode] = useState<BillingAddressMode>(() =>
    cart.billingAddress && !cart.shippingMatchesBillingAddress
      ? 'different'
      : 'same',
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
