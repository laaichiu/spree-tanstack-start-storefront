// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { parsePurchaseInput } from './customer-review-inputs.server'

const market = { country: 'de', locale: 'de-DE' }

describe('customer review purchase input boundary', () => {
  it('accepts a product slug with Spree resource ids for the purchase', async () => {
    await expect(
      parsePurchaseInput({
        market,
        orderId: 'or_order',
        productId: 'localized-product-slug',
        variantId: 'variant_variant',
      }),
    ).resolves.toMatchObject({
      orderId: 'or_order',
      productId: 'localized-product-slug',
      variantId: 'variant_variant',
    })
  })

  it.each([
    ['orderId', '123', 'Expected an Order resource id.'],
    ['variantId', '123', 'Expected a Variant resource id.'],
  ])('rejects a raw %s', async (field, value, message) => {
    const input = {
      market,
      orderId: 'or_order',
      productId: 'localized-product-slug',
      variantId: 'variant_variant',
      [field]: value,
    }

    await expect(parsePurchaseInput(input)).rejects.toThrow(message)
  })
})
