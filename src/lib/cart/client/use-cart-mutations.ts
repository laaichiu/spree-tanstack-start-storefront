import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { CartSummary } from '@/lib/cart/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import {
  addToCart,
  removeCartItem,
  updateCartItem,
} from '../api/cart-item.functions'
import { resetCartSession } from '../api/cart-session.functions'
import {
  getCartMutationScopeId,
  getCartMutationKey,
  getCartResetMutationKey,
} from './cart-mutation'
import { cartQueryKey, getCartQueryKey, syncCartQueryData } from './cart-query'

type CartMutationMarket = Pick<MarketSelectionInput, 'country' | 'locale'>
type CartMutationCartOwner = string | null

type AddToCartInput = {
  quantity: number
  variantId: string
}

type AddToCartMutationVariables = AddToCartInput & {
  requestCartId: CartMutationCartOwner
  requestMarket: CartMutationMarket
}

type UpdateCartItemInput = {
  cartId?: string | null
  lineItemId: string
  quantity: number
}

type UpdateCartItemMutationVariables = Omit<UpdateCartItemInput, 'cartId'> & {
  requestCartId: CartMutationCartOwner
  requestMarket: CartMutationMarket
}

type RemoveCartItemInput = {
  cartId?: string | null
  lineItemId: string
}

type RemoveCartItemMutationVariables = Omit<RemoveCartItemInput, 'cartId'> & {
  requestCartId: CartMutationCartOwner
  requestMarket: CartMutationMarket
}

function getCurrentCartId(
  cart: CartSummary | null | undefined,
): CartMutationCartOwner {
  return cart?.id ?? null
}

export function useAddToCart({ market }: { market: MarketSelectionInput }) {
  const addToCartFn = useServerFn(addToCart)
  const queryClient = useQueryClient()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const getRequestCartId = () =>
    getCurrentCartId(
      queryClient.getQueryData<CartSummary | null>(
        getCartQueryKey(marketInput),
      ),
    )
  const mutationKey = getCartMutationKey(market)

  const mutation = useMutation({
    mutationKey,
    scope: { id: getCartMutationScopeId(market) },
    mutationFn: ({
      requestMarket,
      quantity,
      variantId,
    }: AddToCartMutationVariables) =>
      addToCartFn({
        data: {
          market: requestMarket,
          quantity,
          variantId,
        },
      }),
    onMutate: async ({ requestMarket }) => {
      const handoverFromCart = queryClient.getQueryData<CartSummary | null>(
        getCartQueryKey(requestMarket),
      )

      await queryClient.cancelQueries({
        queryKey: getCartQueryKey(requestMarket),
      })

      return {
        handoverFromCart,
      }
    },
    onSuccess: (cart, { requestMarket }, mutationContext) => {
      syncCartQueryData({
        cart,
        country: requestMarket.country,
        handoverFromCart: mutationContext.handoverFromCart,
        locale: requestMarket.locale,
        queryClient,
      })
    },
  })

  return {
    ...mutation,
    mutateAsync: (input: AddToCartInput) =>
      mutation.mutateAsync({
        ...input,
        requestCartId: getRequestCartId(),
        requestMarket: marketInput,
      }),
  }
}

export function useUpdateCartItem({
  market,
}: {
  market: MarketSelectionInput
}) {
  const updateCartItemFn = useServerFn(updateCartItem)
  const queryClient = useQueryClient()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const mutationKey = getCartMutationKey(market)

  const mutation = useMutation({
    mutationKey,
    scope: { id: getCartMutationScopeId(market) },
    mutationFn: ({
      lineItemId,
      quantity,
      requestMarket,
    }: UpdateCartItemMutationVariables) =>
      updateCartItemFn({
        data: {
          market: requestMarket,
          lineItemId,
          quantity,
        },
      }),
    onMutate: ({ requestMarket }) =>
      queryClient.cancelQueries({
        queryKey: getCartQueryKey(requestMarket),
      }),
    onSuccess: (cart, { requestMarket }) => {
      syncCartQueryData({
        cart,
        country: requestMarket.country,
        locale: requestMarket.locale,
        queryClient,
      })
    },
  })

  return {
    ...mutation,
    mutateAsync: ({ cartId, ...input }: UpdateCartItemInput) =>
      mutation.mutateAsync({
        ...input,
        requestCartId: cartId ?? null,
        requestMarket: marketInput,
      }),
  }
}

export function useRemoveCartItem({
  market,
}: {
  market: MarketSelectionInput
}) {
  const removeCartItemFn = useServerFn(removeCartItem)
  const queryClient = useQueryClient()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const mutationKey = getCartMutationKey(market)

  const mutation = useMutation({
    mutationKey,
    scope: { id: getCartMutationScopeId(market) },
    mutationFn: ({
      lineItemId,
      requestMarket,
    }: RemoveCartItemMutationVariables) =>
      removeCartItemFn({
        data: {
          market: requestMarket,
          lineItemId,
        },
      }),
    onMutate: ({ requestMarket }) =>
      queryClient.cancelQueries({
        queryKey: getCartQueryKey(requestMarket),
      }),
    onSuccess: (cart, { requestMarket }) => {
      syncCartQueryData({
        cart,
        country: requestMarket.country,
        locale: requestMarket.locale,
        queryClient,
      })
    },
  })

  return {
    ...mutation,
    mutateAsync: ({ cartId, ...input }: RemoveCartItemInput) =>
      mutation.mutateAsync({
        ...input,
        requestCartId: cartId ?? null,
        requestMarket: marketInput,
      }),
  }
}

export function useResetCartSession({
  market,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  const resetCartSessionFn = useServerFn(resetCartSession)
  const queryClient = useQueryClient()
  const mutationKey = getCartResetMutationKey(market)
  const mutation = useMutation({
    mutationKey,
    scope: { id: getCartMutationScopeId(market) },
    mutationFn: () => resetCartSessionFn(),
    onMutate: () =>
      queryClient.cancelQueries({
        queryKey: getCartQueryKey({
          country: market.country,
          locale: market.locale,
        }),
      }),
    onSuccess: () => {
      try {
        return Promise.resolve(
          queryClient.invalidateQueries({
            queryKey: cartQueryKey,
          }),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })

  return {
    ...mutation,
    mutateAsync: () => {
      const hasPendingReset = queryClient
        .getMutationCache()
        .findAll({ exact: true, mutationKey })
        .some((candidate) => candidate.state.status === 'pending')

      return hasPendingReset ? Promise.resolve(null) : mutation.mutateAsync()
    },
  }
}
