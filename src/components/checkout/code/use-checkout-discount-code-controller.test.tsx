import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { FormEvent, PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mapSpreeCartToSummary } from '@/lib/cart/mappers/cart.mapper'
import { baseCart } from '@/lib/cart/mappers/cart.mapper.fixture'
import { getCheckoutMutationKey } from '@/lib/checkout/client/checkout-mutation'

import { useCheckoutDiscountCodeController } from './use-checkout-discount-code-controller'

const server = vi.hoisted(() => ({
  applyCode: vi.fn(),
  removeDiscountCode: vi.fn(),
  removeGiftCard: vi.fn(),
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: {
      country: 'us',
      currencyCode: 'USD',
      locale: 'en',
      marketId: 'market-us',
      marketName: 'United States',
    },
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/checkout/client/use-checkout-code', () => ({
  useApplyCheckoutCode: () => ({
    isPending: false,
    mutateAsync: server.applyCode,
  }),
  useRemoveCheckoutDiscountCode: () => ({
    isPending: false,
    mutateAsync: server.removeDiscountCode,
  }),
  useRemoveCheckoutGiftCard: () => ({
    isPending: false,
    mutateAsync: server.removeGiftCard,
  }),
}))

const cart = mapSpreeCartToSummary(baseCart)

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  function Harness({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { queryClient, Wrapper: Harness }
}

function createSubmitEvent() {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout discount-code controller', () => {
  it('ignores a duplicate code submit while the first request is in flight', async () => {
    let resolveApply: (value: { success: boolean }) => void = () => undefined
    server.applyCode.mockReturnValueOnce(
      new Promise<{ success: boolean }>((resolve) => {
        resolveApply = resolve
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => useCheckoutDiscountCodeController({ cart }),
      { wrapper: Wrapper },
    )
    const event = createSubmitEvent()

    act(() => {
      result.current.actions.codeChange('SAVE10')
    })
    act(() => {
      result.current.actions.submit(event)
      result.current.actions.submit(event)
    })

    await waitFor(() => expect(server.applyCode).toHaveBeenCalledOnce())

    await act(async () => {
      resolveApply({ success: true })
      await Promise.resolve()
    })

    expect(server.applyCode).toHaveBeenCalledOnce()
  })

  it('releases the code guard after a failed apply so retry remains available', async () => {
    server.applyCode
      .mockRejectedValueOnce(new Error('apply failed'))
      .mockResolvedValueOnce({ success: true })
    const { Wrapper } = createHarness()
    const { result } = renderHook(
      () => useCheckoutDiscountCodeController({ cart }),
      { wrapper: Wrapper },
    )
    const event = createSubmitEvent()

    act(() => {
      result.current.actions.codeChange('SAVE10')
    })
    act(() => {
      result.current.actions.submit(event)
    })
    await waitFor(() => expect(server.applyCode).toHaveBeenCalledOnce())

    act(() => {
      result.current.actions.submit(createSubmitEvent())
    })
    await waitFor(() => expect(server.applyCode).toHaveBeenCalledTimes(2))
  })

  it('does not let an old apply failure write or release the new cart owner', async () => {
    let rejectFirstApply: (error: Error) => void = () => undefined
    let resolveSecondApply: (value: {
      success: boolean
      type: 'discount'
    }) => void = () => undefined
    const firstApply = new Promise<{ success: boolean; type: 'discount' }>(
      (_, reject) => {
        rejectFirstApply = reject
      },
    )
    const secondApply = new Promise<{ success: boolean; type: 'discount' }>(
      (resolve) => {
        resolveSecondApply = resolve
      },
    )
    const firstCart = { ...cart, id: 'cart-first' }
    const secondCart = { ...cart, id: 'cart-second' }
    server.applyCode
      .mockReturnValueOnce(firstApply)
      .mockReturnValueOnce(secondApply)
    const { Wrapper } = createHarness()
    const { result, rerender } = renderHook(
      ({ currentCart }: { currentCart: typeof cart }) =>
        useCheckoutDiscountCodeController({ cart: currentCart }),
      {
        initialProps: { currentCart: firstCart },
        wrapper: Wrapper,
      },
    )

    act(() => {
      result.current.actions.codeChange('SAVE10')
    })
    act(() => {
      result.current.actions.submit(createSubmitEvent())
    })
    await waitFor(() => expect(server.applyCode).toHaveBeenCalledOnce())

    rerender({ currentCart: secondCart })
    act(() => {
      result.current.actions.codeChange('NEWCODE')
    })
    act(() => {
      result.current.actions.submit(createSubmitEvent())
    })
    await waitFor(() => expect(server.applyCode).toHaveBeenCalledTimes(2))

    await act(async () => {
      rejectFirstApply(new Error('old apply failed'))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.model.codeError).toBeNull()
    expect(result.current.model.code).toBe('NEWCODE')

    act(() => {
      result.current.actions.submit(createSubmitEvent())
    })
    expect(server.applyCode).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecondApply({ success: true, type: 'discount' })
      await Promise.resolve()
    })

    expect(result.current.model.code).toBe('')
    expect(result.current.model.statusMessage).toBe(
      'checkout.discountCodeApplied',
    )
  })

  it('ignores a same-tick code submit from another observer while the mutation cache is pending', async () => {
    let resolveApply: (value: { success: boolean }) => void = () => undefined
    const applyPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveApply = resolve
    })
    let resolvePendingMutation: () => void = () => undefined
    const pendingMutation = new Promise<void>((resolve) => {
      resolvePendingMutation = resolve
    })
    server.applyCode.mockReturnValueOnce(applyPromise)
    const { queryClient, Wrapper } = createHarness()
    const { result: pendingMutationResult } = renderHook(
      () =>
        useMutation({
          mutationKey: getCheckoutMutationKey({
            cartId: cart.id,
            market: {
              country: 'us',
              locale: 'en',
            },
          }),
          mutationFn: () => pendingMutation,
        }),
      { wrapper: Wrapper },
    )
    const { result } = renderHook(
      () => ({
        first: useCheckoutDiscountCodeController({ cart }),
        second: useCheckoutDiscountCodeController({ cart }),
      }),
      { wrapper: Wrapper },
    )

    act(() => {
      result.current.first.actions.codeChange('SAVE10')
    })
    act(() => {
      result.current.first.actions.submit(createSubmitEvent())
    })
    void pendingMutationResult.current.mutateAsync()
    await waitFor(() => {
      expect(server.applyCode).toHaveBeenCalledOnce()
      expect(
        queryClient.isMutating({
          mutationKey: getCheckoutMutationKey({
            cartId: cart.id,
            market: { country: 'us', locale: 'en' },
          }),
        }),
      ).toBe(1)
    })

    act(() => {
      result.current.second.actions.codeChange('SAVE10')
      result.current.second.actions.submit(createSubmitEvent())
    })

    expect(server.applyCode).toHaveBeenCalledOnce()

    await act(async () => {
      resolvePendingMutation()
      resolveApply({ success: true })
      await Promise.resolve()
    })
  })
})
