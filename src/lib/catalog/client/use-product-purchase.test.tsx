import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Product } from '../contracts'

import { useProductPurchase } from './use-product-purchase'

const server = vi.hoisted(() => ({
  addToCart: vi.fn(),
}))

vi.mock('@/lib/cart/client/use-cart-mutations', () => ({
  useAddToCart: () => ({
    error: null,
    isPending: false,
    mutateAsync: server.addToCart,
  }),
}))

const market = {
  country: 'us',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}

const product = {
  categoryBreadcrumbs: [],
  compareAtPrice: null,
  defaultVariantId: 'variant-default',
  description: 'A useful bowl.',
  descriptionHtml: '<p>A useful bowl.</p>',
  id: 'product-1',
  images: [],
  inStock: true,
  metaDescription: '',
  metaTitle: null,
  name: 'Everyday Bowl',
  options: [],
  preorder: false,
  preorderShipsAt: null,
  price: { amount: 24, currencyCode: 'USD' },
  purchasable: true,
  slug: 'everyday-bowl',
  specifications: [],
  variantCount: 1,
  variants: [],
} satisfies Product

const sizeOption = {
  id: 'option-size',
  label: 'Size',
  name: 'Size',
  values: [
    {
      colorCode: null,
      id: 'value-small',
      imageUrl: null,
      label: 'Small',
      name: 'Small',
    },
    {
      colorCode: null,
      id: 'value-large',
      imageUrl: null,
      label: 'Large',
      name: 'Large',
    },
  ],
}

function optionVariant(
  id: string,
  valueId: string,
): Product['variants'][number] {
  return {
    backorderable: false,
    id,
    inStock: true,
    optionValues: [
      {
        colorCode: null,
        id: valueId,
        imageUrl: null,
        label: valueId === 'value-small' ? 'Small' : 'Large',
        name: valueId,
        optionTypeId: sizeOption.id,
        optionTypeLabel: sizeOption.label,
        optionTypeName: sizeOption.name,
      },
    ],
    preorder: false,
    preorderShipsAt: null,
    price: { amount: 24, currencyCode: 'USD' },
    sku: id,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('product purchase controller', () => {
  it('ignores a duplicate add-to-cart while the first request is in flight', async () => {
    let resolveAdd: () => void = () => undefined
    server.addToCart.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveAdd = resolve
      }),
    )
    const { result } = renderHook(() => useProductPurchase(product, { market }))

    let firstAdd: Promise<void> | undefined
    act(() => {
      firstAdd = result.current.addSelectedVariantToCart()
      void result.current.addSelectedVariantToCart()
    })

    await waitFor(() => expect(server.addToCart).toHaveBeenCalledOnce())
    expect(result.current.isAddingToCart).toBe(true)
    expect(server.addToCart).toHaveBeenCalledWith({
      quantity: 1,
      variantId: 'variant-default',
    })

    await act(async () => {
      resolveAdd()
      await firstAdd
    })

    expect(server.addToCart).toHaveBeenCalledOnce()
    expect(result.current.isAddingToCart).toBe(false)
  })

  it('releases the add-to-cart guard after a failed request', async () => {
    server.addToCart
      .mockRejectedValueOnce(new Error('add failed'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useProductPurchase(product, { market }))

    await act(async () => {
      await result.current.addSelectedVariantToCart()
    })
    await act(async () => {
      await result.current.addSelectedVariantToCart()
    })

    expect(server.addToCart).toHaveBeenCalledTimes(2)
  })

  it('does not open the cart when a stale product request settles', async () => {
    let resolveAdd: () => void = () => undefined
    server.addToCart.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveAdd = resolve
      }),
    )
    const onOpenCart = vi.fn()
    window.addEventListener('spree-storefront:open-cart', onOpenCart)
    const { result, rerender } = renderHook(
      ({ productId }: { productId: string }) =>
        useProductPurchase({ ...product, id: productId }, { market }),
      { initialProps: { productId: 'product-1' } },
    )

    let addRequest: Promise<void> | undefined
    act(() => {
      addRequest = result.current.addSelectedVariantToCart()
    })
    await waitFor(() => expect(server.addToCart).toHaveBeenCalledOnce())

    rerender({ productId: 'product-2' })

    await act(async () => {
      resolveAdd()
      await addRequest
    })

    expect(onOpenCart).not.toHaveBeenCalled()
    window.removeEventListener('spree-storefront:open-cart', onOpenCart)
  })

  it('does not expose stale pending or error state after a product refresh', async () => {
    let rejectAdd: (error: Error) => void = () => undefined
    server.addToCart.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectAdd = reject
      }),
    )
    const { result, rerender } = renderHook(
      ({ productId }: { productId: string }) =>
        useProductPurchase({ ...product, id: productId }, { market }),
      { initialProps: { productId: 'product-1' } },
    )

    let addRequest: Promise<void> | undefined
    act(() => {
      addRequest = result.current.addSelectedVariantToCart()
    })
    await waitFor(() => expect(server.addToCart).toHaveBeenCalledOnce())

    rerender({ productId: 'product-2' })

    expect(result.current.isAddingToCart).toBe(false)
    expect(result.current.hasAddToCartError).toBe(false)

    await act(async () => {
      rejectAdd(new Error('stale add failed'))
      await addRequest
    })

    expect(result.current.isAddingToCart).toBe(false)
    expect(result.current.hasAddToCartError).toBe(false)
  })

  it('allows a new variant add after the previous variant request fails', async () => {
    let rejectFirstAdd: (error: Error) => void = () => undefined
    const firstAdd = new Promise<void>((_, reject) => {
      rejectFirstAdd = reject
    })
    server.addToCart
      .mockReturnValueOnce(firstAdd)
      .mockResolvedValueOnce(undefined)
    const smallVariant = optionVariant('variant-small', 'value-small')
    const largeVariant = optionVariant('variant-large', 'value-large')
    const productWithOptions = {
      ...product,
      defaultVariantId: smallVariant.id,
      id: 'product-with-options',
      options: [sizeOption],
      variantCount: 2,
      variants: [smallVariant, largeVariant],
    }
    const { result } = renderHook(() =>
      useProductPurchase(productWithOptions, { market }),
    )

    let firstRequest: Promise<void> | undefined
    act(() => {
      firstRequest = result.current.addSelectedVariantToCart()
    })
    await waitFor(() => expect(server.addToCart).toHaveBeenCalledOnce())

    act(() => {
      result.current.selectOption(sizeOption.id, 'value-large')
    })

    expect(result.current.isAddingToCart).toBe(false)
    expect(result.current.hasAddToCartError).toBe(false)

    let secondRequest: Promise<void> | undefined
    act(() => {
      secondRequest = result.current.addSelectedVariantToCart()
    })
    await waitFor(() => expect(server.addToCart).toHaveBeenCalledTimes(2))

    await act(async () => {
      rejectFirstAdd(new Error('small variant unavailable'))
      await firstRequest
      await secondRequest
    })

    expect(server.addToCart).toHaveBeenNthCalledWith(1, {
      quantity: 1,
      variantId: smallVariant.id,
    })
    expect(server.addToCart).toHaveBeenNthCalledWith(2, {
      quantity: 1,
      variantId: largeVariant.id,
    })
    expect(result.current.hasAddToCartError).toBe(false)
    expect(result.current.isAddingToCart).toBe(false)
  })

  it('reconciles an option selection removed by a product refresh', async () => {
    const smallVariant = optionVariant('variant-small', 'value-small')
    const largeVariant = optionVariant('variant-large', 'value-large')
    const initialProduct = {
      ...product,
      defaultVariantId: smallVariant.id,
      id: 'product-with-size',
      options: [sizeOption],
      variantCount: 2,
      variants: [smallVariant, largeVariant],
    }
    const refreshedProduct = {
      ...initialProduct,
      options: [{ ...sizeOption, values: [sizeOption.values[0]] }],
      variantCount: 1,
      variants: [smallVariant],
    }
    const { result, rerender } = renderHook(
      ({ currentProduct }: { currentProduct: Product }) =>
        useProductPurchase(currentProduct, { market }),
      { initialProps: { currentProduct: initialProduct } },
    )

    act(() => {
      result.current.selectOption(sizeOption.id, 'value-large')
    })
    expect(result.current.selectedOptions).toEqual({
      [sizeOption.id]: 'value-large',
    })

    rerender({ currentProduct: refreshedProduct })

    await waitFor(() => {
      expect(result.current.selectedOptions).toEqual({
        [sizeOption.id]: 'value-small',
      })
    })
  })
})
