import type { CartShippingRate } from '@/lib/cart/contracts'
import { getSelectedCheckoutShippingRate } from '@/lib/checkout/contracts'
import type {
  CheckoutAddressInput,
  CheckoutOrder,
  CheckoutRequirementSection,
  CheckoutSectionErrors,
} from '@/lib/checkout/contracts'
import type { MessageKey } from '../../../i18n/messages'

import { getCheckoutPaymentSubmitRefreshAction } from '../payment/payment-submit-refresh'
import type { CheckoutPaymentSubmitRefreshAction } from '../payment/payment-submit-refresh'
import { getBlockingCheckoutRequirementsNotice } from './checkout-requirements'

export type CheckoutSubmitPreparationResult =
  | { type: 'invalid' }
  | { type: 'abort' }
  | {
      refreshAction: CheckoutPaymentSubmitRefreshAction
      type: 'ready'
    }

type CheckoutSubmitValidationResult =
  { type: 'invalid' } | { address: CheckoutAddressInput; type: 'valid' }

export type CheckoutSubmitPreparationOptions = {
  cart: CheckoutOrder
  ensureSelectedCheckoutShippingRate: (
    order: CheckoutOrder,
    preferredRate: CartShippingRate | null,
  ) => Promise<CheckoutOrder | null>
  persistBillingAddress: (
    currentCart?: CheckoutOrder,
  ) => Promise<CheckoutOrder | null>
  persistCheckoutAddress: (
    address: CheckoutAddressInput,
  ) => Promise<CheckoutOrder | null | undefined>
  paymentStateKey: string
  selectedShippingRate: CartShippingRate | null
  setCheckoutError: (error: string | null) => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSingleCheckoutSectionError: (
    section: CheckoutRequirementSection,
    message: string,
  ) => void
  t: (key: MessageKey) => string
  validateForms: () => Promise<CheckoutSubmitValidationResult>
  isCurrent?: () => boolean
}

export async function prepareCheckoutPaymentSubmission({
  cart,
  ensureSelectedCheckoutShippingRate,
  persistBillingAddress,
  persistCheckoutAddress,
  paymentStateKey,
  selectedShippingRate,
  setCheckoutError,
  setCheckoutSectionErrorsAndScroll,
  setSingleCheckoutSectionError,
  t,
  validateForms,
  isCurrent = () => true,
}: CheckoutSubmitPreparationOptions): Promise<CheckoutSubmitPreparationResult> {
  const formValidation = await validateForms()

  if (!isCurrent()) {
    return { type: 'abort' }
  }

  if (formValidation.type === 'invalid') {
    return { type: 'invalid' }
  }

  const preferredShippingRate = selectedShippingRate
  const updatedCart = await persistCheckoutAddress(formValidation.address)

  if (!isCurrent()) {
    return { type: 'abort' }
  }

  if (updatedCart === null) {
    return { type: 'abort' }
  }

  if (updatedCart && updatedCart.id !== cart.id) {
    return { type: 'abort' }
  }

  const deliveryCart = updatedCart
    ? await ensureSelectedCheckoutShippingRate(
        updatedCart,
        preferredShippingRate,
      )
    : cart

  if (!isCurrent()) {
    return { type: 'abort' }
  }

  if (!deliveryCart) {
    const message = t('checkout.selectShippingBeforePayment')

    setCheckoutError(message)
    setSingleCheckoutSectionError('shipping', message)
    return { type: 'abort' }
  }

  const deliveryRequirementsNotice = getBlockingCheckoutRequirementsNotice({
    fallbackMessage: t('checkout.completeDeliveryBeforePayment'),
    order: deliveryCart,
  })

  if (deliveryRequirementsNotice) {
    setCheckoutError(deliveryRequirementsNotice.message)
    setCheckoutSectionErrorsAndScroll(deliveryRequirementsNotice.sectionErrors)
    return { type: 'abort' }
  }

  const billingCart = await persistBillingAddress(deliveryCart)

  if (!isCurrent()) {
    return { type: 'abort' }
  }

  if (!billingCart) {
    return { type: 'abort' }
  }

  const billingShippingRate =
    getSelectedCheckoutShippingRate(deliveryCart) ?? preferredShippingRate
  const paymentReadyCart = await ensureSelectedCheckoutShippingRate(
    billingCart,
    billingShippingRate,
  )

  if (!isCurrent()) {
    return { type: 'abort' }
  }

  if (!paymentReadyCart) {
    const message = t('checkout.selectShippingBeforePayment')

    setCheckoutError(message)
    setSingleCheckoutSectionError('shipping', message)
    return { type: 'abort' }
  }

  const paymentReadyRequirementsNotice = getBlockingCheckoutRequirementsNotice({
    fallbackMessage: t('checkout.completeDeliveryBeforePayment'),
    order: paymentReadyCart,
  })

  if (paymentReadyRequirementsNotice) {
    setCheckoutError(paymentReadyRequirementsNotice.message)
    setCheckoutSectionErrorsAndScroll(
      paymentReadyRequirementsNotice.sectionErrors,
    )
    return { type: 'abort' }
  }

  return {
    refreshAction: getCheckoutPaymentSubmitRefreshAction({
      currentCartId: cart.id,
      fallbackShippingRate: billingShippingRate,
      paymentReadyCart,
      previousPaymentStateKey: paymentStateKey,
    }),
    type: 'ready',
  }
}
