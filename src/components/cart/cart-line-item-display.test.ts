import { describe, expect, it } from 'vitest'

import type { CartLineItem } from '@/lib/cart/contracts'
import { getCheckoutSummaryLineItemPresentations } from '@/components/checkout/summary/checkout-summary-line-item-display'
import { getCartLineItemPresentation } from './cart-line-item-display'

const item: CartLineItem = {
  compareAtTotalPrice: { amount: 7.0368, currencyCode: 'USD' },
  id: 'li_precision',
  imageUrl: null,
  name: 'Bulk item',
  optionValues: [],
  optionsText: '',
  productSlug: 'bulk-item',
  quantity: 3,
  totalPrice: { amount: 3.7035, currencyCode: 'USD' },
  unitPrice: { amount: 1.2345, currencyCode: 'USD' },
  variantId: 'variant_precision',
}

describe('cart line item display', () => {
  it('shows unit precision while retaining currency precision for totals', () => {
    const cart = getCartLineItemPresentation(item, 'en-US')
    const checkout = getCheckoutSummaryLineItemPresentations({
      items: [item],
      locale: 'en-US',
    })[0]

    expect(cart.unitPrice.priceLabel).toBe('$1.2345')
    expect(cart.totalPrice).toEqual({
      compareAtPriceLabel: '$7.04',
      priceLabel: '$3.70',
    })
    expect(checkout.price).toBe('$3.70')
    expect(checkout.compareAtPrice).toBe('$7.04')
  })
})
