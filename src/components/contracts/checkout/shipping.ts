import type { CheckoutSavedAddressDisplay } from '@/components/checkout/address/checkout-saved-address-display'
import type { CheckoutShippingMethodPresentation } from '@/components/checkout/shipping/checkout-shipping-method-display'

export type CheckoutSavedAddressesModel = {
  addresses: readonly CheckoutSavedAddressDisplay[]
  disabled: boolean
  manualAddressLabel: string
  selectedAddressId: string | null
  title: string
}

export type CheckoutSavedAddressesActions = {
  selectAddress: (addressId: string) => void
  useManualAddress: () => void
}

export type CheckoutShippingMethodsModel =
  | {
      status: 'placeholder'
      placeholder: string
    }
  | {
      status: 'methods'
      disabled: boolean
      methods: readonly CheckoutShippingMethodPresentation[]
      selectedMethodId: string | null
    }
