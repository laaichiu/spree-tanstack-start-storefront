export const checkoutFieldClassName =
  'h-14 bg-background px-4 text-lg leading-5 font-normal tracking-normal normal-case'
export const checkoutLabelClassName = 'sr-only'

export type BillingAddressMode = 'same' | 'different'

// Keep the existing module as the address form's stable internal entry point
// while the implementation is organized by change reason.
export {
  getCheckoutAddressFormDefaults,
  getCheckoutAddressFormDefaultsFromCustomerAddress,
  getCheckoutAddressSignature,
  getCheckoutBillingAddressFormDefaults,
  getInitialSavedAddressSignature,
} from './checkout-address-values'
export {
  readCheckoutAddressFormValues,
  readCheckoutBillingAddressFormValues,
} from './checkout-address-dom-reader'
