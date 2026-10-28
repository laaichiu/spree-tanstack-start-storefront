// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { ProductVariant, ProductVariantOptionValue } from './product'
import { getProductColorVariants } from './product-color-variants'

const colorOptionValue: ProductVariantOptionValue = {
  colorCode: '#345b82',
  id: 'value-blue',
  imageUrl: null,
  label: 'Blue',
  name: 'blue',
  optionTypeId: 'option-color',
  optionTypeLabel: 'Color',
  optionTypeName: 'color',
}

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    backorderable: false,
    id: 'variant-blue',
    inStock: true,
    optionValues: [colorOptionValue],
    preorder: false,
    preorderShipsAt: null,
    price: { amount: 24, currencyCode: 'USD' },
    sku: 'BLUE',
    ...overrides,
  }
}

describe('catalog product color variants', () => {
  it('prefers a priced purchasable variant over an unpriced one', () => {
    const unpricedVariant = variant({
      id: 'variant-blue-unpriced',
      price: null,
    })
    const pricedVariant = variant({ id: 'variant-blue-priced' })

    expect(
      getProductColorVariants([unpricedVariant, pricedVariant], null),
    ).toMatchObject([
      {
        optionValue: { id: colorOptionValue.id },
        variant: pricedVariant,
      },
    ])
  })

  it('does not let an unpriced default variant beat a priced sibling', () => {
    const unpricedDefaultVariant = variant({
      id: 'variant-blue-default',
      price: null,
    })
    const pricedSiblingVariant = variant({ id: 'variant-blue-priced-sibling' })

    expect(
      getProductColorVariants(
        [unpricedDefaultVariant, pricedSiblingVariant],
        unpricedDefaultVariant.id,
      ),
    ).toMatchObject([
      {
        optionValue: { id: colorOptionValue.id },
        variant: pricedSiblingVariant,
      },
    ])
  })
})
