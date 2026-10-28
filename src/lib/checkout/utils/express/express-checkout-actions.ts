import type { CartShippingRate } from '@/lib/cart/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import type { CheckoutCompletionResult } from '../completion/checkout-completion-contract'
import type { ExpressCheckoutAddressParams } from './express-checkout-address'
import type { ExpressCheckoutLineItem } from './express-checkout-amounts'
import type { ExpressCheckoutOrderResult } from '../../api/express/checkout-express.types'
import type {
  CheckoutPaymentSession,
  CheckoutPaymentSessionInputData,
} from '../payment/payment-session-contract'

export type ExpressCheckoutRateSelectionInput = {
  fulfillmentId: string
  rateId: string
}

export type ExpressCheckoutPaymentActions = {
  completeOrder: (input: {
    selectedShippingRate?: CartShippingRate | null
  }) => Promise<CheckoutCompletionResult>
  completePaymentSession: (input: {
    selectedShippingRate?: CartShippingRate | null
    sessionId: string
    sessionResult?: string
  }) => Promise<CheckoutPaymentSession>
  createPaymentSession: (input: {
    paymentData?: CheckoutPaymentSessionInputData
    paymentMethodId: string
    selectedShippingRate?: CartShippingRate | null
  }) => Promise<CheckoutPaymentSession>
  preparePayment: (input: {
    billingAddress: ExpressCheckoutAddressParams
    email: string
    shippingAddress: ExpressCheckoutAddressParams
  }) => Promise<ExpressCheckoutOrderResult>
}

export type ExpressCheckoutShippingActions = {
  resolveShipping: (
    address: ExpressCheckoutPartialAddressInput,
  ) => Promise<ExpressCheckoutOrderResult>
  selectShippingRates: (
    selections: ExpressCheckoutRateSelectionInput[],
  ) => Promise<ExpressCheckoutOrderResult>
}

export type ExpressCheckoutPartialAddressInput = {
  city: string
  countryIso: string
  postalCode: string
  stateAbbr?: string
  stateName?: string
}

export type ExpressCheckoutLineItemsBuilder = (
  order: CheckoutOrder,
  options?: {
    amountDueShippingAmount?: number
    shippingAmount?: number
  },
) => ExpressCheckoutLineItem[]

export type { ExpressCheckoutLineItem }
