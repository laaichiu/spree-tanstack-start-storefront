import type { UseFormReturn } from 'react-hook-form'

import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import type { MessageKey } from '@/lib/i18n/messages'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import {
  checkoutAddressSchema,
  checkoutBillingAddressSchema,
} from '@/lib/checkout/validation/address'

import { getCheckoutPaymentSubmitRefreshAction } from '../payment/checkout-payment-submit-refresh'
import type { CheckoutPaymentSubmitRefreshAction } from '../payment/checkout-payment-submit-refresh'
import type {
  CheckoutSectionErrorKey,
  CheckoutSectionErrors,
} from '../checkout-requirements'
import { getBlockingCheckoutRequirementsNotice } from '../checkout-requirements'
import { getSelectedCheckoutShippingRate } from '@/lib/checkout/utils/shipping/shipping-rate-selection'
import type {
  CheckoutAddressFormSyncResult,
  CheckoutBillingAddressFormSyncResult,
  EnsureCheckoutShippingRate,
  PersistCheckoutAddress,
  PersistCheckoutBillingAddress,
} from '../address/use-checkout-address-controller'

export type CheckoutSubmitPreparationResult =
  | {
      type: 'invalid'
    }
  | {
      type: 'abort'
    }
  | {
      refreshAction: CheckoutPaymentSubmitRefreshAction
      type: 'ready'
    }

export type CheckoutSubmitPreparationOptions = {
  cart: CheckoutOrder
  form: UseFormReturn<CheckoutAddressInput>
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: 'same' | 'different'
  selectedShippingRate: CartShippingRate | null
  paymentStateKey: string
  handleSyncedBillingFields: (
    changedFields: Array<keyof CheckoutBillingAddressInput>,
  ) => void
  syncDeliveryFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutAddressFormSyncResult
  syncBillingFormValuesFromDom: (options?: {
    shouldValidate?: boolean
  }) => CheckoutBillingAddressFormSyncResult
  persistCheckoutAddress: PersistCheckoutAddress
  persistBillingAddress: PersistCheckoutBillingAddress
  ensureSelectedCheckoutShippingRate: EnsureCheckoutShippingRate
  setCheckoutError: (error: string | null) => void
  setCheckoutSectionErrorsAndScroll: (
    nextSectionErrors: CheckoutSectionErrors,
  ) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
  scrollToCheckoutSection: (section: CheckoutSectionErrorKey) => void
  t: (key: MessageKey) => string
}

export async function prepareCheckoutPaymentSubmission({
  cart,
  form,
  billingForm,
  billingMode,
  selectedShippingRate,
  paymentStateKey,
  handleSyncedBillingFields,
  syncDeliveryFormValuesFromDom,
  syncBillingFormValuesFromDom,
  persistCheckoutAddress,
  persistBillingAddress,
  ensureSelectedCheckoutShippingRate,
  setCheckoutError,
  setCheckoutSectionErrorsAndScroll,
  setSingleCheckoutSectionError,
  scrollToCheckoutSection,
  t,
}: CheckoutSubmitPreparationOptions): Promise<CheckoutSubmitPreparationResult> {
  const { values: formValues } = syncDeliveryFormValuesFromDom({
    shouldValidate: true,
  })
  const syncedBillingAddress =
    billingMode === 'different'
      ? syncBillingFormValuesFromDom({ shouldValidate: true })
      : null

  if (syncedBillingAddress) {
    handleSyncedBillingFields(syncedBillingAddress.changedFields)
  }

  const parsedAddress = checkoutAddressSchema.safeParse(formValues)
  const parsedBillingAddress =
    syncedBillingAddress !== null
      ? checkoutBillingAddressSchema.safeParse(syncedBillingAddress.values)
      : null

  if (!parsedAddress.success || parsedBillingAddress?.success === false) {
    await Promise.all([
      !parsedAddress.success ? form.trigger() : Promise.resolve(true),
      parsedBillingAddress?.success === false
        ? billingForm.trigger()
        : Promise.resolve(true),
    ])

    scrollToCheckoutSection(parsedAddress.success ? 'payment' : 'address')
    return { type: 'invalid' }
  }

  const preferredShippingRate = selectedShippingRate
  const updatedCart = await persistCheckoutAddress(parsedAddress.data)

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

  if (!billingCart) {
    return { type: 'abort' }
  }

  const billingShippingRate =
    getSelectedCheckoutShippingRate(deliveryCart) ?? preferredShippingRate
  const paymentReadyCart = await ensureSelectedCheckoutShippingRate(
    billingCart,
    billingShippingRate,
  )

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
