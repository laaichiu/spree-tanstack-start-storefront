import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAddToCart } from '@/components/cart/use-cart'
import type { Product } from '@/lib/catalog/model/product'

import { useProductPurchase } from './use-product-purchase'

vi.mock('@/components/cart/use-cart', () => ({
  useAddToCart: vi.fn(),
}))

const product = {
  categoryBreadcrumbs: [],
  compareAtPrice: { amount: 15, currencyCode: 'USD' },
  defaultVariantId: 'variant-small',
  description: 'A useful mug.',
  descriptionHtml: '<p>A useful mug.</p>',
  id: 'product-1',
  images: [],
  inStock: true,
  metaTitle: null,
  metaDescription: '',
  name: 'Everyday Mug',
  options: [
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
  variantCount: 2,
  variants: [
    {
      id: 'variant-small',
      inStock: false,
      preorder: false,
      preorderShipsAt: null,
      optionValues: [
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
      price: { amount: 10, currencyCode: 'USD' },
      sku: 'MUG-S',
    },
    {
      compareAtPrice: { amount: 16, currencyCode: 'USD' },
      id: 'variant-large',
      inStock: true,
      preorder: false,
      preorderShipsAt: null,
      optionValues: [
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
      price: { amount: 12, currencyCode: 'USD' },
      sku: 'MUG-L',
    },
  ],
} satisfies Product

const mutateAsync = vi.fn(async () => undefined)

describe('useProductPurchase', () => {
  beforeEach(() => {
    mutateAsync.mockReset()
    vi.mocked(useAddToCart).mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync,
    } as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('selects the first in-stock variant and submits it through the cart capability', async () => {
    const openCart = vi.fn()
    window.addEventListener('spree-storefront:open-cart', openCart)
    const { result } = renderHook(() => useProductPurchase(product))

    expect(result.current.selectedVariant?.id).toBe('variant-large')
    expect(result.current.activePrice).toEqual({
      amount: 12,
      currencyCode: 'USD',
    })
    expect(result.current.activeCompareAtPrice).toEqual({
      amount: 16,
      currencyCode: 'USD',
    })
    expect(result.current.activeSku).toBe('MUG-L')
    expect(result.current.availability).toBe('ready')

    await act(() => result.current.addSelectedVariantToCart())

    expect(mutateAsync).toHaveBeenCalledWith({
      quantity: 1,
      variantId: 'variant-large',
    })
    expect(openCart).toHaveBeenCalledOnce()
    window.removeEventListener('spree-storefront:open-cart', openCart)
  })

  it('prevents submission when the selected variant is out of stock', async () => {
    const { result } = renderHook(() => useProductPurchase(product))

    act(() => result.current.selectOption('option-size', 'value-small'))

    expect(result.current.selectedVariant?.id).toBe('variant-small')
    expect(result.current.activePrice).toEqual({
      amount: 10,
      currencyCode: 'USD',
    })
    expect(result.current.availability).toBe('unavailable')
    expect(result.current.canAddToCart).toBe(false)

    await act(() => result.current.addSelectedVariantToCart())

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('allows a purchasable backorder variant even when it is not on hand', async () => {
    const backorderProduct = {
      ...product,
      variants: product.variants.map((variant) =>
        variant.id === 'variant-small'
          ? { ...variant, purchasable: true }
          : variant,
      ),
    }
    const { result } = renderHook(() => useProductPurchase(backorderProduct))

    act(() => result.current.selectOption('option-size', 'value-small'))

    expect(result.current.selectedVariant?.id).toBe('variant-small')
    expect(result.current.canAddToCart).toBe(true)

    await act(() => result.current.addSelectedVariantToCart())

    expect(mutateAsync).toHaveBeenCalledWith({
      quantity: 1,
      variantId: 'variant-small',
    })
  })

  it('distinguishes an invalid option combination from an unavailable variant', () => {
    const { result } = renderHook(() => useProductPurchase(product))

    act(() => result.current.selectOption('option-size', 'missing-value'))

    expect(result.current.selectedVariant).toBeNull()
    expect(result.current.availability).toBe('select_variant')
    expect(result.current.canAddToCart).toBe(false)
  })

  it('preserves the single-variant API fallback when expanded variants are absent', async () => {
    const productWithoutExpandedVariant = {
      ...product,
      defaultVariantId: 'variant-default',
      options: [],
      variantCount: 1,
      variants: [],
    }
    const { result } = renderHook(() =>
      useProductPurchase(productWithoutExpandedVariant),
    )

    expect(result.current.selectedVariant).toBeNull()
    expect(result.current.canAddToCart).toBe(true)

    await act(() => result.current.addSelectedVariantToCart())

    expect(mutateAsync).toHaveBeenCalledWith({
      quantity: 1,
      variantId: 'variant-default',
    })
  })

  it('exposes pending and mapped error state without exposing the mutation object', () => {
    vi.mocked(useAddToCart).mockReturnValue({
      error: new Error('Mapped cart error'),
      isPending: true,
      mutateAsync,
    } as never)

    const { result } = renderHook(() => useProductPurchase(product))

    expect(result.current.isAddingToCart).toBe(true)
    expect(result.current.hasAddToCartError).toBe(true)
    expect('mutation' in result.current).toBe(false)
  })
})
