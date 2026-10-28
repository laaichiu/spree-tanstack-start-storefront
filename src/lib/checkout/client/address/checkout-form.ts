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
