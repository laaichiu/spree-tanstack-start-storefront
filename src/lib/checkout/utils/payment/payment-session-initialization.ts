import type { CartShippingRate } from '@/lib/cart/contracts'
import type { MessageKey } from '../../../i18n/messages'

import {
  getCheckoutPaymentSessionInputData,
  readSafePaymentSessionErrorMessage,
  readStripeClientSecret,
} from './payment-session'
import type { CheckoutPaymentSession } from './payment-session-contract'

export type CreateCheckoutPaymentSessionAsync = (input: {
  paymentData?: ReturnType<typeof getCheckoutPaymentSessionInputData>
  paymentMethodId: string
  selectedShippingRate?: CartShippingRate | null
}) => Promise<CheckoutPaymentSession>

export type CheckoutPaymentSessionInitializationResult =
  | { type: 'success'; session: CheckoutPaymentSession }
  | { type: 'missing_client_secret'; message: string }
  | { type: 'error'; message: string }

export async function initializeCheckoutPaymentSession({
  createPaymentSessionAsync,
  selectedPaymentMethodId,
  selectedSavedStripePaymentMethodId,
  selectedShippingRate,
  t,
}: {
  createPaymentSessionAsync: CreateCheckoutPaymentSessionAsync
  selectedPaymentMethodId: string
  selectedSavedStripePaymentMethodId: string | null
  selectedShippingRate: CartShippingRate | null
  t: (key: MessageKey) => string
}): Promise<CheckoutPaymentSessionInitializationResult> {
  try {
    const session = await createPaymentSessionAsync({
      paymentData: getCheckoutPaymentSessionInputData({
        savedStripePaymentMethodId: selectedSavedStripePaymentMethodId,
      }),
      paymentMethodId: selectedPaymentMethodId,
      selectedShippingRate,
    })

    if (!readStripeClientSecret(session.providerData)) {
      return {
        message: t('checkout.stripeClientSecretMissing'),
        type: 'missing_client_secret',
      }
    }

    return { session, type: 'success' }
  } catch (error) {
    return {
      message: readSafePaymentSessionErrorMessage(
        error,
        t('checkout.paymentSessionCreateFailed'),
      ),
      type: 'error',
    }
  }
}
