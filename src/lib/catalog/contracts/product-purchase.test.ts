// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { Product } from './product'
import { getProductPurchaseState } from './product-purchase-state'
import {
  getDefaultSelectedOptions,
  isCatalogItemPurchasable,
  isOptionValueSelectable,
  resolveSelectedVariant,
} from './variant-selection'

const product = {
  categoryBreadcrumbs: [],
  compareAtPrice: { amount: 15, currencyCode: 'USD' },
  defaultVariantId: 'variant-stone-small',
  description: 'A useful mug.',
  descriptionHtml: '<p>A useful mug.</p>',
  id: 'product-1',
  images: [],
  inStock: true,
  metaDescription: '',
  metaTitle: null,
  name: 'Everyday Mug',
  options: [
    {
      id: 'option-color',
      label: 'Color',
      name: 'color',
      values: [
        {
          colorCode: null,
          id: 'value-stone',
          imageUrl: null,
          label: 'Stone',
          name: 'stone',
        },
        {
          colorCode: '#111111',
          id: 'value-black',
          imageUrl: null,
          label: 'Black',
          name: 'black',
        },
      ],
    },
    {
      id: 'option-size',
      label: 'Size',
      name: 'size',
      values: [
        {
          colorCode: null,
          id: 'value-small',
          imageUrl: null,
          label: 'Small',
          name: 'small',
        },
        {
          colorCode: null,
          id: 'value-large',
          imageUrl: null,
          label: 'Large',
          name: 'large',
        },
      ],
    },
  ],
  price: { amount: 10, currencyCode: 'USD' },
  purchasable: true,
  preorder: false,
  preorderShipsAt: null,
  slug: 'everyday-mug',
  specifications: [],
  variantCount: 3,
  variants: [
    {
      id: 'variant-stone-small',
      inStock: false,
      optionValues: [
        {
          colorCode: null,
          id: 'value-stone',
          imageUrl: null,
          label: 'Stone',
          name: 'stone',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
        {
          colorCode: null,
          id: 'value-small',
          imageUrl: null,
          label: 'Small',
          name: 'small',
          optionTypeId: 'option-size',
          optionTypeLabel: 'Size',
          optionTypeName: 'size',
        },
      ],
      preorder: false,
      preorderShipsAt: null,
      price: { amount: 10, currencyCode: 'USD' },
      sku: 'STONE-S',
    },
    {
      compareAtPrice: { amount: 16, currencyCode: 'USD' },
      id: 'variant-stone-large',
      inStock: true,
      optionValues: [
        {
          colorCode: null,
          id: 'value-stone',
          imageUrl: null,
          label: 'Stone',
          name: 'stone',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
        {
          colorCode: null,
          id: 'value-large',
          imageUrl: null,
          label: 'Large',
          name: 'large',
          optionTypeId: 'option-size',
          optionTypeLabel: 'Size',
          optionTypeName: 'size',
        },
      ],
      preorder: false,
      preorderShipsAt: null,
      price: { amount: 12, currencyCode: 'USD' },
      sku: 'STONE-L',
    },
    {
      id: 'variant-black-small',
      inStock: true,
      optionValues: [
        {
          colorCode: '#111111',
          id: 'value-black',
          imageUrl: null,
          label: 'Black',
          name: 'black',
          optionTypeId: 'option-color',
          optionTypeLabel: 'Color',
          optionTypeName: 'color',
        },
        {
          colorCode: null,
          id: 'value-small',
          imageUrl: null,
          label: 'Small',
          name: 'small',
          optionTypeId: 'option-size',
          optionTypeLabel: 'Size',
          optionTypeName: 'size',
        },
      ],
      preorder: false,
      preorderShipsAt: null,
      price: { amount: 11, currencyCode: 'USD' },
      sku: 'BLACK-S',
    },
  ],
} satisfies Product

describe('catalog variant and inventory rules', () => {
  it('defaults to the first purchasable variant and resolves complete selections', () => {
    expect(getDefaultSelectedOptions(product)).toEqual({
      'option-color': 'value-stone',
      'option-size': 'value-large',
    })
    expect(
      resolveSelectedVariant(product, {
        'option-color': 'value-black',
        'option-size': 'value-small',
      })?.id,
    ).toBe('variant-black-small')
  })

  it('prefers a priced purchasable variant over an earlier unpriced variant', () => {
    const unpricedVariant = {
      ...product.variants[1],
      id: 'variant-stone-large-unpriced',
      price: null,
    }
    const pricedVariant = {
      ...product.variants[2],
      id: 'variant-black-small-priced',
    }

    expect(
      getDefaultSelectedOptions({
        ...product,
        variants: [unpricedVariant, pricedVariant],
      }),
    ).toEqual({
      'option-color': 'value-black',
      'option-size': 'value-small',
    })
  })

  it('rejects unavailable option combinations', () => {
    expect(
      resolveSelectedVariant(product, {
        'option-color': 'value-black',
        'option-size': 'value-large',
      }),
    ).toBeNull()
    expect(
      isOptionValueSelectable({
        optionId: 'option-size',
        product,
        selectedOptions: {
          'option-color': 'value-stone',
          'option-size': 'value-large',
        },
        valueId: 'value-small',
      }),
    ).toBe(false)
  })

  it('uses explicit purchasability before inventory fallbacks', () => {
    expect(
      isCatalogItemPurchasable({ inStock: true, purchasable: false }),
    ).toBe(false)
    expect(
      isCatalogItemPurchasable({ backorderable: true, inStock: false }),
    ).toBe(true)
    expect(isCatalogItemPurchasable({ inStock: false, preorder: true })).toBe(
      true,
    )
  })

  it('projects the selected variant into the purchase action state', () => {
    expect(getProductPurchaseState(product)).toMatchObject({
      activeCompareAtPrice: { amount: 16, currencyCode: 'USD' },
      activeDiscountPercent: 25,
      activePrice: { amount: 12, currencyCode: 'USD' },
      activeSku: 'STONE-L',
      addableVariantId: 'variant-stone-large',
      availability: 'ready',
      canAddToCart: true,
      isPreorder: false,
      selectedVariant: product.variants[1],
    })
  })

  it('distinguishes unavailable variants from incomplete combinations', () => {
    expect(
      getProductPurchaseState(product, {
        'option-color': 'value-stone',
        'option-size': 'value-small',
      }),
    ).toMatchObject({ availability: 'unavailable', canAddToCart: false })
    expect(
      getProductPurchaseState(product, {
        'option-color': 'value-black',
        'option-size': 'value-large',
      }),
    ).toMatchObject({ availability: 'select_variant', canAddToCart: false })
  })

  it('keeps the single-variant fallback when expanded variants are absent', () => {
    const singleVariantProduct = {
      ...product,
      defaultVariantId: 'variant-default',
      options: [],
      variantCount: 1,
      variants: [],
    }

    expect(getProductPurchaseState(singleVariantProduct)).toMatchObject({
      activePrice: { amount: 10, currencyCode: 'USD' },
      addableVariantId: 'variant-default',
      availability: 'ready',
      canAddToCart: true,
      selectedVariant: null,
    })
  })

  it('does not fall back to an unrelated default variant when variants are expanded', () => {
    const unavailableVariantProduct = {
      ...product,
      defaultVariantId: 'variant-from-another-product',
      options: [],
      variantCount: 1,
      variants: [
        {
          ...product.variants[0],
          inStock: false,
          purchasable: false,
        },
      ],
    }

    expect(getProductPurchaseState(unavailableVariantProduct)).toMatchObject({
      addableVariantId: null,
      availability: 'unavailable',
      canAddToCart: false,
      selectedVariant: unavailableVariantProduct.variants[0],
    })
  })

  it('does not use the product price for an unpriced selected variant', () => {
    const unpricedVariant = {
      ...product.variants[1],
      compareAtPrice: null,
      price: null,
    }
    const unpricedVariantProduct = {
      ...product,
      variants: [product.variants[0], unpricedVariant, product.variants[2]],
    }

    expect(
      getProductPurchaseState(unpricedVariantProduct, {
        'option-color': 'value-stone',
        'option-size': 'value-large',
      }),
    ).toMatchObject({
      activeCompareAtPrice: null,
      activeDiscountPercent: null,
      activePrice: null,
      addableVariantId: null,
      availability: 'unavailable',
      canAddToCart: false,
      selectedVariant: unpricedVariant,
    })
  })

  it('does not add an unpriced single variant when variants are not expanded', () => {
    const unpricedSingleVariantProduct = {
      ...product,
      defaultVariantId: 'variant-default',
      options: [],
      price: null,
      variantCount: 1,
      variants: [],
    }

    expect(getProductPurchaseState(unpricedSingleVariantProduct)).toMatchObject(
      {
        activePrice: null,
        addableVariantId: null,
        availability: 'unavailable',
        canAddToCart: false,
        selectedVariant: null,
      },
    )
  })
})
