import '@tanstack/react-start/server-only'

import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { readCheckoutCodeErrorMessage } from '@/lib/checkout/utils/code/checkout-code'
import {
  isCartResourceIdentityMismatchError,
  isCartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'

import {
  assertCheckoutCartMatchesMarket,
  getCheckoutCartRequestOptions,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import { toRemoveCheckoutCodeSuccessResult } from './checkout-code-result.server'
import type { RemoveCheckoutCodeResult } from './checkout-code-result.server'

export async function removeCheckoutDiscountCodeFromCart({
  cartId,
  cartToken,
  code,
  market,
}: {
  cartId: string
  cartToken?: string
  code: string
  market: CheckoutMarket
}): Promise<RemoveCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const validatedCartToken = await assertCheckoutCartMatchesMarket({
    cartId,
    cartToken,
    client,
    market,
  })
  const requestOptions = getCheckoutCartRequestOptions(validatedCartToken)

  let discountCart: Parameters<
    typeof toRemoveCheckoutCodeSuccessResult
  >[0]['cart']
  try {
    discountCart = await client.carts.discountCodes.remove(
      cartId,
      code,
      requestOptions,
    )
  } catch (error) {
    if (
      isCartResourceIdentityMismatchError(error) ||
      isCartResourceTypeMismatchError(error)
    ) {
      throw error
    }

    return {
      error: readCheckoutCodeErrorMessage(
        error,
        'Discount code could not be removed.',
      ),
      success: false,
    }
  }

  return toRemoveCheckoutCodeSuccessResult({
    cart: discountCart,
    cartId,
    cartToken: validatedCartToken,
    expectedCurrentCartToken: cartToken,
    market,
  })
}

export async function removeCheckoutGiftCardFromCart({
  cartId,
  cartToken,
  giftCardId,
  market,
}: {
  cartId: string
  cartToken?: string
  giftCardId: string
  market: CheckoutMarket
}): Promise<RemoveCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const validatedCartToken = await assertCheckoutCartMatchesMarket({
    cartId,
    cartToken,
    client,
    market,
  })
  const requestOptions = getCheckoutCartRequestOptions(validatedCartToken)

  let giftCardCart: Parameters<
    typeof toRemoveCheckoutCodeSuccessResult
  >[0]['cart']
  try {
    giftCardCart = await client.carts.giftCards.remove(
      cartId,
      giftCardId,
      requestOptions,
    )
  } catch (error) {
    if (
      isCartResourceIdentityMismatchError(error) ||
      isCartResourceTypeMismatchError(error)
    ) {
      throw error
    }

    return {
      error: readCheckoutCodeErrorMessage(
        error,
        'Gift card could not be removed.',
      ),
      success: false,
    }
  }

  return toRemoveCheckoutCodeSuccessResult({
    cart: giftCardCart,
    cartId,
    cartToken: validatedCartToken,
    expectedCurrentCartToken: cartToken,
    market,
  })
}
