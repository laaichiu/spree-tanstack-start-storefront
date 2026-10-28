import '@tanstack/react-start/server-only'

import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import {
  isCartResourceIdentityMismatchError,
  isCartResourceTypeMismatchError,
} from '@/lib/cart/utils/cart-identity'
import {
  readCheckoutCodeErrorMessage,
  shouldPreferDiscountCodeErrorAfterGiftCardError,
  shouldTryGiftCardAfterDiscountCodeError,
} from '@/lib/checkout/utils/code/checkout-code'

import {
  assertCheckoutCartMatchesMarket,
  getCheckoutCartRequestOptions,
} from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import { toCheckoutCodeSuccessResult } from './checkout-code-result.server'
import type { ApplyCheckoutCodeResult } from './checkout-code-result.server'

export async function applyCheckoutCodeToCart({
  cartId,
  cartToken,
  code,
  market,
}: {
  cartId: string
  cartToken?: string
  code: string
  market: CheckoutMarket
}): Promise<ApplyCheckoutCodeResult> {
  const client = getServerSpreeClientForMarket(market)
  const validatedCartToken = await assertCheckoutCartMatchesMarket({
    cartId,
    cartToken,
    client,
    market,
  })
  const requestOptions = getCheckoutCartRequestOptions(validatedCartToken)

  let discountCart: Parameters<typeof toCheckoutCodeSuccessResult>[0]['cart']
  try {
    discountCart = await client.carts.discountCodes.apply(
      cartId,
      code,
      requestOptions,
    )
  } catch (discountError) {
    if (
      isCartResourceIdentityMismatchError(discountError) ||
      isCartResourceTypeMismatchError(discountError)
    ) {
      throw discountError
    }

    if (!shouldTryGiftCardAfterDiscountCodeError(discountError)) {
      return {
        error: readCheckoutCodeErrorMessage(discountError),
        success: false,
      }
    }

    let giftCardCart: Parameters<typeof toCheckoutCodeSuccessResult>[0]['cart']
    try {
      giftCardCart = await client.carts.giftCards.apply(
        cartId,
        code,
        requestOptions,
      )
    } catch (giftCardError) {
      if (
        isCartResourceIdentityMismatchError(giftCardError) ||
        isCartResourceTypeMismatchError(giftCardError)
      ) {
        throw giftCardError
      }

      return {
        error: readCheckoutCodeErrorMessage(
          shouldPreferDiscountCodeErrorAfterGiftCardError(giftCardError)
            ? discountError
            : giftCardError,
        ),
        success: false,
      }
    }

    return toCheckoutCodeSuccessResult({
      cart: giftCardCart,
      cartId,
      cartToken: validatedCartToken,
      expectedCurrentCartToken: cartToken,
      market,
      type: 'gift_card',
    })
  }

  return toCheckoutCodeSuccessResult({
    cart: discountCart,
    cartId,
    cartToken: validatedCartToken,
    expectedCurrentCartToken: cartToken,
    market,
    type: 'discount',
  })
}
