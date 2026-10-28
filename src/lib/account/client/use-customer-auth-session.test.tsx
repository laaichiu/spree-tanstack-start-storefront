import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cartQueryKey } from '@/lib/cart/client/cart-query'
import {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
} from '@/lib/checkout/client/use-checkout-order'

import {
  registerCustomer,
  resetCustomerPassword,
} from '../api/account.functions'
import { loginCustomer } from '../api/login.functions'
import { useCustomerPasswordResetConfirmation } from './use-customer-password-reset-confirmation'
import { useCustomerLogin } from './use-customer-login'
import { useCustomerRegistration } from './use-customer-registration'

vi.mock('../api/account.functions', () => ({
  registerCustomer: vi.fn(),
  resetCustomerPassword: vi.fn(),
}))

vi.mock('../api/login.functions', () => ({
  loginCustomer: vi.fn(),
}))

const market = { country: 'us', locale: 'en' }

function createHarness(queryClient: QueryClient) {
  return function Harness({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function seedCommerceQueries(queryClient: QueryClient) {
  queryClient.setQueryData([...cartQueryKey, 'us', 'en'], { id: 'cart_guest' })
  queryClient.setQueryData(
    [...checkoutOrderQueryKey, 'us', 'en', 'cart_guest'],
    { id: 'cart_guest' },
  )
  queryClient.setQueryData(
    [...checkoutOrderSnapshotQueryKey, 'us', 'en', 'cart_guest'],
    { id: 'cart_guest' },
  )
}

function expectCommerceQueriesCleared(queryClient: QueryClient) {
  expect(
    queryClient.getQueryData([...cartQueryKey, 'us', 'en']),
  ).toBeUndefined()
  expect(
    queryClient.getQueryData([
      ...checkoutOrderQueryKey,
      'us',
      'en',
      'cart_guest',
    ]),
  ).toBeUndefined()
  expect(
    queryClient.getQueryData([
      ...checkoutOrderSnapshotQueryKey,
      'us',
      'en',
      'cart_guest',
    ]),
  ).toBeUndefined()
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('customer auth session commerce cleanup', () => {
  it('serializes auth transitions that share the global cookie owner', async () => {
    let resolveLogin: (value: never) => void = () => undefined
    const login = new Promise<never>((resolve) => {
      resolveLogin = resolve
    })
    vi.mocked(loginCustomer).mockReturnValueOnce(login)
    vi.mocked(registerCustomer).mockResolvedValue({
      id: 'cust_registered',
    } as never)
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => ({
        login: useCustomerLogin({ market }),
        registration: useCustomerRegistration({ market }),
      }),
      { wrapper: createHarness(queryClient) },
    )

    let loginPromise: Promise<unknown> | undefined
    let registrationPromise: Promise<unknown> | undefined
    act(() => {
      loginPromise = result.current.login.mutateAsync({
        email: 'ada@example.com',
        password: 'password123',
      })
      registrationPromise = result.current.registration.mutateAsync({
        acceptsEmailMarketing: false,
        email: 'grace@example.com',
        firstName: 'Grace',
        lastName: 'Hopper',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
    })

    expect(registerCustomer).not.toHaveBeenCalled()

    await act(async () => {
      resolveLogin(undefined as never)
      await loginPromise
      await registrationPromise
    })

    expect(registerCustomer).toHaveBeenCalledOnce()
  })

  it('ignores a duplicate login submit while pending', async () => {
    let resolveLogin: (value: never) => void = () => undefined
    vi.mocked(loginCustomer).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveLogin = resolve
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCustomerLogin({ market }), {
      wrapper: createHarness(queryClient),
    })
    const input = { email: 'ada@example.com', password: 'password123' }

    act(() => {
      result.current.submit(input)
      result.current.submit(input)
    })

    await waitFor(() => expect(loginCustomer).toHaveBeenCalledOnce())
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveLogin(undefined as never)
      await waitFor(() => expect(result.current.isPending).toBe(false))
    })
  })

  it('ignores a same-tick login submit from another observer', async () => {
    let resolveLogin: (value: never) => void = () => undefined
    vi.mocked(loginCustomer).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveLogin = resolve
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => ({
        first: useCustomerLogin({ market }),
        second: useCustomerLogin({ market }),
      }),
      { wrapper: createHarness(queryClient) },
    )
    const input = { email: 'ada@example.com', password: 'password123' }

    act(() => {
      result.current.first.submit(input)
      result.current.second.submit(input)
    })

    await waitFor(() => expect(loginCustomer).toHaveBeenCalledOnce())

    await act(async () => {
      resolveLogin(undefined as never)
      await waitFor(() => expect(result.current.first.isPending).toBe(false))
    })

    expect(loginCustomer).toHaveBeenCalledOnce()
  })

  it('ignores a duplicate registration submit while pending', async () => {
    let resolveRegistration: (value: never) => void = () => undefined
    vi.mocked(registerCustomer).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveRegistration = resolve
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCustomerRegistration({ market }), {
      wrapper: createHarness(queryClient),
    })
    const input = {
      acceptsEmailMarketing: false,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: 'password123',
      passwordConfirmation: 'password123',
    }

    act(() => {
      result.current.submit(input)
      result.current.submit(input)
    })

    await waitFor(() => expect(registerCustomer).toHaveBeenCalledOnce())
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveRegistration(undefined as never)
      await waitFor(() => expect(result.current.isPending).toBe(false))
    })
  })

  it('clears cart and checkout projections before login navigation', async () => {
    const queryClient = createQueryClient()
    const onLoggedIn = vi.fn()
    seedCommerceQueries(queryClient)
    vi.mocked(loginCustomer).mockResolvedValue({ id: 'cust_current' } as never)

    const { result } = renderHook(
      () => useCustomerLogin({ market, onLoggedIn }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.mutateAsync({
        email: 'ada@example.com',
        password: 'password123',
      })
    })

    expectCommerceQueriesCleared(queryClient)
    expect(onLoggedIn).toHaveBeenCalledOnce()
  })

  it('clears cart and checkout projections before registration navigation', async () => {
    const queryClient = createQueryClient()
    const onRegistered = vi.fn()
    seedCommerceQueries(queryClient)
    vi.mocked(registerCustomer).mockResolvedValue({
      id: 'cust_current',
    } as never)

    const { result } = renderHook(
      () => useCustomerRegistration({ market, onRegistered }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.mutateAsync({
        acceptsEmailMarketing: false,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
    })

    expectCommerceQueriesCleared(queryClient)
    expect(onRegistered).toHaveBeenCalledOnce()
  })

  it('clears cart and checkout projections before password-reset navigation', async () => {
    const queryClient = createQueryClient()
    const onReset = vi.fn()
    seedCommerceQueries(queryClient)
    vi.mocked(resetCustomerPassword).mockResolvedValue({
      id: 'cust_current',
    } as never)

    const { result } = renderHook(
      () => useCustomerPasswordResetConfirmation({ market, onReset }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await result.current.mutateAsync({
        password: 'password123',
        passwordConfirmation: 'password123',
        token: 'reset-token',
      })
    })

    expectCommerceQueriesCleared(queryClient)
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('keeps login successful when the navigation callback fails', async () => {
    const onLoggedIn = vi.fn().mockRejectedValue(new Error('navigation failed'))
    vi.mocked(loginCustomer).mockResolvedValue({ id: 'cust_current' } as never)
    const queryClient = createQueryClient()

    const { result } = renderHook(
      () => useCustomerLogin({ market, onLoggedIn }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: 'ada@example.com',
          password: 'password123',
        }),
      ).resolves.toEqual({ id: 'cust_current' })
    })

    expect(onLoggedIn).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('keeps registration successful when the navigation callback fails', async () => {
    const onRegistered = vi
      .fn()
      .mockRejectedValue(new Error('navigation failed'))
    vi.mocked(registerCustomer).mockResolvedValue({
      id: 'cust_current',
    } as never)
    const queryClient = createQueryClient()

    const { result } = renderHook(
      () => useCustomerRegistration({ market, onRegistered }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          acceptsEmailMarketing: false,
          email: 'ada@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          password: 'password123',
          passwordConfirmation: 'password123',
        }),
      ).resolves.toEqual({ id: 'cust_current' })
    })

    expect(onRegistered).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('keeps password reset successful when the navigation callback fails', async () => {
    const onReset = vi.fn().mockRejectedValue(new Error('navigation failed'))
    vi.mocked(resetCustomerPassword).mockResolvedValue({
      id: 'cust_current',
    } as never)
    const queryClient = createQueryClient()

    const { result } = renderHook(
      () => useCustomerPasswordResetConfirmation({ market, onReset }),
      { wrapper: createHarness(queryClient) },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          password: 'password123',
          passwordConfirmation: 'password123',
          token: 'reset-token',
        }),
      ).resolves.toEqual({ id: 'cust_current' })
    })

    expect(onReset).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('uses the current login callback after a market transition', async () => {
    let resolveLogin: (value: never) => void = () => undefined
    vi.mocked(loginCustomer).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveLogin = resolve
      }),
    )
    const oldOnLoggedIn = vi.fn().mockResolvedValue(undefined)
    const currentOnLoggedIn = vi.fn().mockResolvedValue(undefined)
    const queryClient = createQueryClient()
    const { result, rerender } = renderHook(
      ({ currentMarket, onLoggedIn }) =>
        useCustomerLogin({ market: currentMarket, onLoggedIn }),
      {
        initialProps: { currentMarket: market, onLoggedIn: oldOnLoggedIn },
        wrapper: createHarness(queryClient),
      },
    )

    let loginPromise: Promise<unknown> | undefined
    act(() => {
      loginPromise = result.current.mutateAsync({
        email: 'ada@example.com',
        password: 'password123',
      })
    })
    await waitFor(() => expect(loginCustomer).toHaveBeenCalledOnce())

    rerender({
      currentMarket: { country: 'de', locale: 'de' },
      onLoggedIn: currentOnLoggedIn,
    })

    await act(async () => {
      resolveLogin(undefined as never)
      await loginPromise
    })

    expect(oldOnLoggedIn).not.toHaveBeenCalled()
    expect(currentOnLoggedIn).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.isError).toBe(false))
  })

  it('uses the current registration callback after a market transition', async () => {
    let resolveRegistration: (value: never) => void = () => undefined
    vi.mocked(registerCustomer).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveRegistration = resolve
      }),
    )
    const oldOnRegistered = vi.fn().mockResolvedValue(undefined)
    const currentOnRegistered = vi.fn().mockResolvedValue(undefined)
    const queryClient = createQueryClient()
    const { result, rerender } = renderHook(
      ({ currentMarket, onRegistered }) =>
        useCustomerRegistration({ market: currentMarket, onRegistered }),
      {
        initialProps: {
          currentMarket: market,
          onRegistered: oldOnRegistered,
        },
        wrapper: createHarness(queryClient),
      },
    )

    let registrationPromise: Promise<unknown> | undefined
    act(() => {
      registrationPromise = result.current.mutateAsync({
        acceptsEmailMarketing: false,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
    })
    await waitFor(() => expect(registerCustomer).toHaveBeenCalledOnce())

    rerender({
      currentMarket: { country: 'de', locale: 'de' },
      onRegistered: currentOnRegistered,
    })

    await act(async () => {
      resolveRegistration(undefined as never)
      await registrationPromise
    })

    expect(oldOnRegistered).not.toHaveBeenCalled()
    expect(currentOnRegistered).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.isError).toBe(false))
  })

  it('uses the current password-reset callback after a market transition', async () => {
    let resolveReset: (value: never) => void = () => undefined
    vi.mocked(resetCustomerPassword).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveReset = resolve
      }),
    )
    const oldOnReset = vi.fn().mockResolvedValue(undefined)
    const currentOnReset = vi.fn().mockResolvedValue(undefined)
    const queryClient = createQueryClient()
    const { result, rerender } = renderHook(
      ({ currentMarket, onReset }) =>
        useCustomerPasswordResetConfirmation({
          market: currentMarket,
          onReset,
        }),
      {
        initialProps: { currentMarket: market, onReset: oldOnReset },
        wrapper: createHarness(queryClient),
      },
    )

    let resetPromise: Promise<unknown> | undefined
    act(() => {
      resetPromise = result.current.mutateAsync({
        password: 'password123',
        passwordConfirmation: 'password123',
        token: 'reset-token',
      })
    })
    await waitFor(() => expect(resetCustomerPassword).toHaveBeenCalledOnce())

    rerender({
      currentMarket: { country: 'de', locale: 'de' },
      onReset: currentOnReset,
    })

    await act(async () => {
      resolveReset(undefined as never)
      await resetPromise
    })

    expect(oldOnReset).not.toHaveBeenCalled()
    expect(currentOnReset).toHaveBeenCalledOnce()
    await waitFor(() => expect(result.current.isSuccess).toBe(false))
  })

  it('retains a current login failure for retry feedback', async () => {
    vi.mocked(loginCustomer).mockRejectedValueOnce(new Error('login failed'))
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCustomerLogin({ market }), {
      wrapper: createHarness(queryClient),
    })

    act(() => {
      result.current.submit({
        email: 'ada@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('retains a current registration failure for retry feedback', async () => {
    vi.mocked(registerCustomer).mockRejectedValueOnce(
      new Error('registration failed'),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useCustomerRegistration({ market }), {
      wrapper: createHarness(queryClient),
    })

    act(() => {
      result.current.submit({
        acceptsEmailMarketing: false,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('ignores a duplicate password-reset confirmation while pending', async () => {
    let resolveReset: (value: never) => void = () => undefined
    vi.mocked(resetCustomerPassword).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveReset = resolve
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => useCustomerPasswordResetConfirmation({ market }),
      { wrapper: createHarness(queryClient) },
    )
    const input = {
      password: 'password123',
      passwordConfirmation: 'password123',
      token: 'reset-token',
    }

    act(() => {
      result.current.submit(input)
      result.current.submit(input)
    })

    await waitFor(() => expect(resetCustomerPassword).toHaveBeenCalledOnce())
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveReset(undefined as never)
      await waitFor(() => expect(result.current.isPending).toBe(false))
    })
  })

  it('ignores a same-tick password-reset confirmation from another observer', async () => {
    let resolveReset: (value: never) => void = () => undefined
    vi.mocked(resetCustomerPassword).mockReturnValueOnce(
      new Promise<never>((resolve) => {
        resolveReset = resolve
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => ({
        first: useCustomerPasswordResetConfirmation({ market }),
        second: useCustomerPasswordResetConfirmation({ market }),
      }),
      { wrapper: createHarness(queryClient) },
    )
    const input = {
      password: 'password123',
      passwordConfirmation: 'password123',
      token: 'reset-token',
    }

    act(() => {
      result.current.first.submit(input)
      result.current.second.submit(input)
    })

    await waitFor(() => expect(resetCustomerPassword).toHaveBeenCalledOnce())

    await act(async () => {
      resolveReset(undefined as never)
      await waitFor(() => expect(result.current.first.isPending).toBe(false))
    })

    expect(resetCustomerPassword).toHaveBeenCalledOnce()
  })

  it('releases the confirmation duplicate guard after a failed request', async () => {
    vi.mocked(resetCustomerPassword)
      .mockRejectedValueOnce(new Error('reset failed'))
      .mockResolvedValueOnce({ id: 'cust_current' } as never)
    const queryClient = createQueryClient()
    const { result } = renderHook(
      () => useCustomerPasswordResetConfirmation({ market }),
      { wrapper: createHarness(queryClient) },
    )
    const input = {
      password: 'password123',
      passwordConfirmation: 'password123',
      token: 'reset-token',
    }

    act(() => {
      result.current.submit(input)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.submit(input)
    })
    await waitFor(() => expect(resetCustomerPassword).toHaveBeenCalledTimes(2))
  })
})
