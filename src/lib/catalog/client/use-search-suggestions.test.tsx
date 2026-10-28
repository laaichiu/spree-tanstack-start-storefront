import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MarketSelectionInput } from '@/lib/core/market'
import {
  useSearchSuggestionCategories,
  useSearchSuggestions,
} from './use-search-suggestions'

const server = vi.hoisted(() => ({ products: vi.fn(), categories: vi.fn() }))
vi.mock('@tanstack/react-start', () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))
vi.mock('../api/get-search-suggestions', () => ({
  getSearchSuggestionProducts: server.products,
  getSearchSuggestionCategories: server.categories,
}))

const market = { country: 'us', locale: 'en' }
function harness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  return { queryClient, Wrapper }
}

afterEach(cleanup)
beforeEach(() => {
  vi.resetAllMocks()
  server.products.mockResolvedValue([])
  server.categories.mockResolvedValue([])
})

describe('search suggestion query boundaries', () => {
  it('loads products and categories independently only after opening the drawer', async () => {
    const { Wrapper } = harness()
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => ({
        products: useSearchSuggestions({ enabled, market }),
        categories: useSearchSuggestionCategories({ enabled, market }),
      }),
      { initialProps: { enabled: false }, wrapper: Wrapper },
    )
    expect(server.products).not.toHaveBeenCalled()
    expect(server.categories).not.toHaveBeenCalled()
    rerender({ enabled: true })
    await waitFor(() => {
      expect(result.current.products.isSuccess).toBe(true)
      expect(result.current.categories.isSuccess).toBe(true)
    })
    expect(server.products).toHaveBeenCalledWith({ data: market })
    expect(server.categories).toHaveBeenCalledWith({ data: market })
  })

  it.each([
    { country: 'de', locale: 'en' },
    { country: 'us', locale: 'de' },
  ])(
    'does not render a previous market selection while loading %j',
    async (nextMarket) => {
      const first = [{ id: 'ctg_first', name: 'First market' }]
      server.categories
        .mockResolvedValueOnce(first)
        .mockImplementationOnce(() => new Promise(() => {}))
      const { Wrapper } = harness()
      const { result, rerender } = renderHook(
        ({ market: selectedMarket }: { market: MarketSelectionInput }) =>
          useSearchSuggestionCategories({
            enabled: true,
            market: selectedMarket,
          }),
        { initialProps: { market }, wrapper: Wrapper },
      )
      await waitFor(() => expect(result.current.data).toEqual(first))
      rerender({ market: nextMarket })
      expect(result.current.data).toBeUndefined()
      await waitFor(() =>
        expect(server.categories).toHaveBeenLastCalledWith({
          data: nextMarket,
        }),
      )
    },
  )

  it('shares fresh category selections between the suggestions and preview panels', async () => {
    const { Wrapper } = harness()
    const first = renderHook(
      () => useSearchSuggestionCategories({ enabled: true, market }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()
    const preview = renderHook(
      () => useSearchSuggestionCategories({ enabled: true, market }),
      { wrapper: Wrapper },
    )
    await waitFor(() => expect(preview.result.current.isSuccess).toBe(true))
    expect(server.categories).toHaveBeenCalledTimes(1)
  })

  it('keeps product failure separate from categories and allows retrying it', async () => {
    server.products
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce([])
    const { Wrapper } = harness()
    const { result } = renderHook(
      () => ({
        products: useSearchSuggestions({ enabled: true, market }),
        categories: useSearchSuggestionCategories({ enabled: true, market }),
      }),
      { wrapper: Wrapper },
    )
    await waitFor(() => {
      expect(result.current.products.isError).toBe(true)
      expect(result.current.categories.isSuccess).toBe(true)
    })
    await act(async () => {
      await result.current.products.refetch()
    })
    await waitFor(() => expect(result.current.products.isSuccess).toBe(true))
    expect(server.categories).toHaveBeenCalledTimes(1)
  })
})
