import type { CartSummary } from '@/lib/cart/model/cart'

type CartItemsFingerprintInput = Pick<CartSummary, 'items'> | null | undefined

export function getCartItemsFingerprint(cart: CartItemsFingerprintInput) {
  if (!cart) {
    return ''
  }

  return cart.items.map((item) => `${item.id}:${item.quantity}`).join('|')
}

export function cartLineItemsChanged(
  previous: CartItemsFingerprintInput,
  next: CartItemsFingerprintInput,
) {
  return getCartItemsFingerprint(previous) !== getCartItemsFingerprint(next)
}
