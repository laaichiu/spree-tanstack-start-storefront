import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CUSTOMER_SESSION_REQUIRED_ERROR_CODE } from '../utils/customer-session-error'
import { useCustomerProfileUpdate } from './use-customer-profile-update'
import { useCustomerAddressMutations } from './use-customer-address-mutations'
import { useCustomerAddressController } from './use-customer-address-controller'
import { useCustomerCreditCardDeletion } from './use-customer-credit-card-deletion'
import { useCustomerCreditCardDeletionController } from './use-customer-credit-card-deletion-controller'
import { useAccountProfileFormController } from '@/components/account/use-account-profile-form-controller'

const server = vi.hoisted(() => ({
  createCustomerAddress: vi.fn(),
  deleteCustomerAddress: vi.fn(),
  deleteCustomerCreditCard: vi.fn(),
  updateCustomerAddress: vi.fn(),
  updateCustomerProfile: vi.fn(),
}))

const redirectToLogin = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const market = { country: 'us', locale: 'en' }
const customer = vi.hoisted(() => ({
  acceptsEmailMarketing: false,
  availableStoreCreditTotal: null,
  displayAvailableStoreCreditTotal: null,
  email: 'ada@example.com',
  firstName: 'Ada',
  id: 'cust_ada',
  lastName: 'Lovelace',
  phone: null,
}))

vi.mock('./account-session-provider', () => ({
  useAccountSessionRequiredRedirect: () => redirectToLogin,
  useAccountSession: () => customer,
}))

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({ market }),
}))

vi.mock('../api/customer-address.functions', () => ({
  createCustomerAddress: server.createCustomerAddress,
  deleteCustomerAddress: server.deleteCustomerAddress,
  updateCustomerAddress: server.updateCustomerAddress,
}))

vi.mock('../api/customer-credit-card.functions', () => ({
  deleteCustomerCreditCard: server.deleteCustomerCreditCard,
}))

vi.mock('../api/customer-session.functions', () => ({
  updateCustomerProfile: server.updateCustomerProfile,
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}))

const addressInput = {
  address1: '1 Analytical Engine Way',
  address2: '',
  city: 'London',
  company: '',
  countryIso: 'GB',
  firstName: 'Ada',
  isDefaultBilling: false,
  isDefaultShipping: false,
  lastName: 'Lovelace',
  phone: '',
  postalCode: 'W1A 1AA',
  stateAbbr: '',
  stateName: '',
}

const existingAddress = {
  address1: '1 Analytical Engine Way',
  address2: null,
  city: 'London',
  company: null,
  country: 'United Kingdom',
  countryIso: 'GB',
  countryName: 'United Kingdom',
  firstName: 'Ada',
  fullName: 'Ada Lovelace',
  id: 'addr_ada',
  isDefaultBilling: false,
  isDefaultShipping: false,
  lastName: 'Lovelace',
  phone: null,
  postalCode: 'W1A 1AA',
  quickCheckout: false,
  stateAbbr: null,
  stateName: null,
  stateText: null,
}

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return function Harness({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function sessionRequiredError() {
  return { code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE }
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
  customer.id = 'cust_ada'
})

describe('Account mutation session boundary', () => {
  it('redirects after an address save loses the customer session', async () => {
    server.createCustomerAddress.mockRejectedValue(sessionRequiredError())

    const { result } = renderHook(
      () =>
        useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.add()
    })
    act(() => {
      result.current.addressDialog.onSubmit(addressInput)
    })

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledTimes(1))

    expect(result.current.addressDialog.open).toBe(false)
    expect(result.current.errorMessage).toBeNull()
  })

  it('redirects after address deletion loses the customer session', async () => {
    server.deleteCustomerAddress.mockRejectedValue(sessionRequiredError())

    const { result } = renderHook(
      () =>
        useCustomerAddressController({
          addresses: [existingAddress],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.delete(existingAddress.id)
    })
    act(() => {
      result.current.deleteDialog.onConfirm()
    })

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledTimes(1))

    expect(result.current.deleteDialog.address).toBeNull()
    expect(result.current.errorMessage).toBeNull()
  })

  it('serializes address saves and deletions for the same market', async () => {
    let resolveSave: () => void = () => undefined
    server.updateCustomerAddress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      }),
    )
    server.deleteCustomerAddress.mockResolvedValue({ success: true })

    const { result } = renderHook(
      () =>
        useCustomerAddressMutations({
          market,
        }),
      { wrapper: createHarness() },
    )

    let savePromise: Promise<unknown> | undefined
    let deletePromise: Promise<unknown> | undefined
    act(() => {
      savePromise = result.current.addressMutation.mutateAsync({
        id: existingAddress.id,
        values: addressInput,
      })
      deletePromise = result.current.deleteMutation.mutateAsync(
        existingAddress.id,
      )
    })

    await waitFor(() =>
      expect(server.updateCustomerAddress).toHaveBeenCalledOnce(),
    )
    expect(server.deleteCustomerAddress).not.toHaveBeenCalled()

    await act(async () => {
      resolveSave()
      await savePromise
      await deletePromise
    })

    expect(server.deleteCustomerAddress).toHaveBeenCalledOnce()
  })

  it('keeps an address save successful when the refresh callback fails', async () => {
    server.createCustomerAddress.mockResolvedValue({ success: true })
    const onSaved = vi.fn().mockRejectedValue(new Error('refresh failed'))

    const { result } = renderHook(
      () => useCustomerAddressMutations({ market, onSaved }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.addressMutation.mutateAsync({
          values: addressInput,
        }),
      ).resolves.toEqual({ success: true })
    })

    expect(onSaved).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.addressMutation.isSuccess).toBe(true)
      expect(result.current.addressMutation.isError).toBe(false)
    })
  })

  it('keeps the address request error when the error callback fails', async () => {
    const requestError = new Error('address request failed')
    server.createCustomerAddress.mockRejectedValue(requestError)
    const onSaveError = vi
      .fn()
      .mockRejectedValue(new Error('error callback failed'))

    const { result } = renderHook(
      () => useCustomerAddressMutations({ market, onSaveError }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.addressMutation.mutateAsync({
          values: addressInput,
        }),
      ).rejects.toBe(requestError)
    })

    expect(onSaveError).toHaveBeenCalledWith(requestError, undefined)
    await waitFor(() =>
      expect(result.current.addressMutation.isError).toBe(true),
    )
  })

  it('keeps the address deletion error when the error callback fails', async () => {
    const requestError = new Error('address deletion failed')
    server.deleteCustomerAddress.mockRejectedValue(requestError)
    const onDeleteError = vi
      .fn()
      .mockRejectedValue(new Error('error callback failed'))

    const { result } = renderHook(
      () => useCustomerAddressMutations({ market, onDeleteError }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.deleteMutation.mutateAsync({
          addressId: existingAddress.id,
        }),
      ).rejects.toBe(requestError)
    })

    expect(onDeleteError).toHaveBeenCalledWith(requestError, undefined)
    await waitFor(() =>
      expect(result.current.deleteMutation.isError).toBe(true),
    )
  })

  it('keeps address deletion successful when the refresh callback fails', async () => {
    server.deleteCustomerAddress.mockResolvedValue({ success: true })
    const onDeleted = vi.fn().mockRejectedValue(new Error('refresh failed'))

    const { result } = renderHook(
      () => useCustomerAddressMutations({ market, onDeleted }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.deleteMutation.mutateAsync({
          addressId: existingAddress.id,
        }),
      ).resolves.toEqual({ success: true })
    })

    expect(onDeleted).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.deleteMutation.isSuccess).toBe(true)
      expect(result.current.deleteMutation.isError).toBe(false)
    })
  })

  it('ignores a duplicate address save while the first request is in flight', async () => {
    let resolveSave: () => void = () => undefined
    server.createCustomerAddress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(
      () =>
        useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
      result.current.addressDialog.onSubmit(addressInput)
    })

    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledOnce(),
    )
    expect(result.current.addressDialog.open).toBe(true)

    await act(async () => {
      resolveSave()
      await waitFor(() => expect(result.current.addressDialog.open).toBe(false))
    })
  })

  it('ignores a same-tick address save from another observer', async () => {
    let resolveSave: () => void = () => undefined
    server.createCustomerAddress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(
      () => ({
        first: useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
        second: useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.first.actions.add()
      result.current.first.addressDialog.onSubmit(addressInput)
      result.current.second.actions.add()
      result.current.second.addressDialog.onSubmit(addressInput)
    })

    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveSave()
      await waitFor(() =>
        expect(result.current.first.addressDialog.open).toBe(false),
      )
    })

    expect(server.createCustomerAddress).toHaveBeenCalledOnce()
  })

  it('does not invalidate after an address save finishes after unmount', async () => {
    let resolveSave: () => void = () => undefined
    server.createCustomerAddress.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      }),
    )
    const onChanged = vi.fn()

    const { result, unmount } = renderHook(
      () =>
        useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          onChanged,
          saveErrorMessage: 'Unable to save address.',
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
    })
    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledOnce(),
    )

    unmount()

    await act(async () => {
      resolveSave()
      await Promise.resolve()
    })

    expect(onChanged).not.toHaveBeenCalled()
  })

  it('does not redirect after address deletion loses session after unmount', async () => {
    let rejectDelete: (error: unknown) => void = () => undefined
    server.deleteCustomerAddress.mockReturnValueOnce(
      new Promise<void>((_, reject) => {
        rejectDelete = reject
      }),
    )

    const { result, unmount } = renderHook(
      () =>
        useCustomerAddressController({
          addresses: [existingAddress],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.delete(existingAddress.id)
    })
    act(() => {
      result.current.deleteDialog.onConfirm()
    })
    await waitFor(() =>
      expect(server.deleteCustomerAddress).toHaveBeenCalledOnce(),
    )

    unmount()

    await act(async () => {
      rejectDelete(sessionRequiredError())
      await Promise.resolve()
    })

    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('closes an address edit dialog when its address leaves the current list', async () => {
    const { result, rerender } = renderHook(
      ({
        currentAddresses,
      }: {
        currentAddresses: (typeof existingAddress)[]
      }) =>
        useCustomerAddressController({
          addresses: currentAddresses,
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      {
        initialProps: { currentAddresses: [existingAddress] },
        wrapper: createHarness(),
      },
    )

    act(() => {
      result.current.actions.edit(existingAddress.id)
    })
    expect(result.current.addressDialog.open).toBe(true)

    rerender({ currentAddresses: [] })

    await waitFor(() => {
      expect(result.current.addressDialog.open).toBe(false)
      expect(result.current.addressDialog.address).toBeNull()
    })

    act(() => {
      result.current.addressDialog.onSubmit(addressInput)
    })

    expect(server.updateCustomerAddress).not.toHaveBeenCalled()
    expect(server.createCustomerAddress).not.toHaveBeenCalled()
  })

  it('clears a delete target when its address leaves the current list', async () => {
    const { result, rerender } = renderHook(
      ({
        currentAddresses,
      }: {
        currentAddresses: (typeof existingAddress)[]
      }) =>
        useCustomerAddressController({
          addresses: currentAddresses,
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        }),
      {
        initialProps: { currentAddresses: [existingAddress] },
        wrapper: createHarness(),
      },
    )

    act(() => {
      result.current.actions.delete(existingAddress.id)
    })
    expect(result.current.deleteDialog.address).toEqual(existingAddress)

    rerender({ currentAddresses: [] })

    await waitFor(() => {
      expect(result.current.deleteDialog.address).toBeNull()
    })

    act(() => {
      result.current.deleteDialog.onConfirm()
    })

    expect(server.deleteCustomerAddress).not.toHaveBeenCalled()
  })

  it('isolates address state and guards across market transitions', async () => {
    let resolveUsSave: () => void = () => undefined
    let resolveDeSave: () => void = () => undefined
    server.createCustomerAddress
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveUsSave = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveDeSave = resolve
        }),
      )

    const deMarket = { country: 'de', locale: 'de' }
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: currentMarket.country,
          market: currentMarket,
          saveErrorMessage: 'Unable to save address.',
        }),
      {
        initialProps: { currentMarket: market },
        wrapper: createHarness(),
      },
    )

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
    })
    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledOnce(),
    )

    rerender({ currentMarket: deMarket })
    await waitFor(() => expect(result.current.addressDialog.open).toBe(false))

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
    })
    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledTimes(2),
    )
    expect(result.current.addressDialog.open).toBe(true)

    await act(async () => {
      resolveUsSave()
      await Promise.resolve()
    })
    expect(result.current.addressDialog.open).toBe(true)

    await act(async () => {
      resolveDeSave()
      await waitFor(() => expect(result.current.addressDialog.open).toBe(false))
    })
  })

  it('does not block a new customer with a previous customer address save', async () => {
    let resolveFirstSave: () => void = () => undefined
    server.createCustomerAddress
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve
        }),
      )
      .mockResolvedValueOnce({ success: true })

    const { result, rerender } = renderHook(
      ({ version }: { version: number }) => {
        void version
        return useCustomerAddressController({
          addresses: [],
          deleteErrorMessage: 'Unable to delete address.',
          fallbackCountry: 'GB',
          market,
          saveErrorMessage: 'Unable to save address.',
        })
      },
      { initialProps: { version: 0 }, wrapper: createHarness() },
    )

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
    })
    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledOnce(),
    )

    customer.id = 'cust_grace'
    rerender({ version: 1 })
    await waitFor(() => expect(result.current.addressDialog.open).toBe(false))

    act(() => {
      result.current.actions.add()
      result.current.addressDialog.onSubmit(addressInput)
    })

    expect(result.current.addressDialog.isPending).toBe(true)

    await act(async () => {
      resolveFirstSave()
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(server.createCustomerAddress).toHaveBeenCalledTimes(2),
    )
  })

  it('redirects after saved-card deletion loses the customer session', async () => {
    server.deleteCustomerCreditCard.mockRejectedValue(sessionRequiredError())

    const { result } = renderHook(
      () =>
        useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market,
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.deleteCard('card_ada')
    })

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledTimes(1))

    expect(result.current.error).toBeNull()
  })

  it('keeps saved-card deletion successful when the refresh callback fails', async () => {
    server.deleteCustomerCreditCard.mockResolvedValue({ success: true })
    const onDeleted = vi.fn().mockRejectedValue(new Error('refresh failed'))

    const { result } = renderHook(
      () => useCustomerCreditCardDeletion({ market, onDeleted }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({ cardId: 'card_ada' }),
      ).resolves.toEqual({ success: true })
    })

    expect(onDeleted).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('keeps the saved-card request error when the error callback fails', async () => {
    const requestError = new Error('saved-card request failed')
    server.deleteCustomerCreditCard.mockRejectedValue(requestError)
    const onError = vi
      .fn()
      .mockRejectedValue(new Error('error callback failed'))

    const { result } = renderHook(
      () => useCustomerCreditCardDeletion({ market, onError }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({ cardId: 'card_ada' }),
      ).rejects.toBe(requestError)
    })

    expect(onError).toHaveBeenCalledWith(requestError, undefined)
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('serializes saved-card deletions and keeps pending state on each card', async () => {
    let resolveFirstDelete: () => void = () => undefined
    let resolveSecondDelete: () => void = () => undefined
    server.deleteCustomerCreditCard.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveFirstDelete = resolve
      }),
    )
    server.deleteCustomerCreditCard.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSecondDelete = resolve
      }),
    )
    const { result } = renderHook(
      () =>
        useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market,
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.deleteCard('card_ada')
      result.current.deleteCard('card_grace')
    })

    await waitFor(() =>
      expect(server.deleteCustomerCreditCard).toHaveBeenCalledTimes(1),
    )
    expect(result.current.isPendingForCard('card_ada')).toBe(true)
    expect(result.current.isPendingForCard('card_grace')).toBe(true)

    await act(async () => {
      resolveFirstDelete()
      await waitFor(() =>
        expect(server.deleteCustomerCreditCard).toHaveBeenCalledTimes(2),
      )
    })
    expect(result.current.isPendingForCard('card_ada')).toBe(false)
    expect(result.current.isPendingForCard('card_grace')).toBe(true)

    await act(async () => {
      resolveSecondDelete()
      await waitFor(() =>
        expect(result.current.isPendingForCard('card_grace')).toBe(false),
      )
    })
  })

  it('ignores a duplicate saved-card deletion while the first request is in flight', async () => {
    let resolveDelete: () => void = () => undefined
    server.deleteCustomerCreditCard.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveDelete = resolve
      }),
    )
    const { result } = renderHook(
      () =>
        useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market,
        }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.deleteCard('card_ada')
      result.current.deleteCard('card_ada')
    })

    await waitFor(() =>
      expect(server.deleteCustomerCreditCard).toHaveBeenCalledOnce(),
    )
    expect(result.current.isPendingForCard('card_ada')).toBe(true)

    await act(async () => {
      resolveDelete()
      await waitFor(() =>
        expect(result.current.isPendingForCard('card_ada')).toBe(false),
      )
    })
  })

  it('ignores a same-tick saved-card deletion from another observer', async () => {
    let resolveDelete: () => void = () => undefined
    server.deleteCustomerCreditCard.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveDelete = resolve
      }),
    )

    const { result } = renderHook(
      () => ({
        first: useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market,
        }),
        second: useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market,
        }),
      }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.first.deleteCard('card_ada')
      result.current.second.deleteCard('card_ada')
    })

    await waitFor(() =>
      expect(server.deleteCustomerCreditCard).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveDelete()
      await waitFor(() =>
        expect(result.current.first.isPendingForCard('card_ada')).toBe(false),
      )
    })

    expect(server.deleteCustomerCreditCard).toHaveBeenCalledOnce()
  })

  it('isolates saved-card deletion ownership across market transitions', async () => {
    let resolveUsDelete: () => void = () => undefined
    let resolveDeDelete: () => void = () => undefined
    server.deleteCustomerCreditCard
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveUsDelete = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveDeDelete = resolve
        }),
      )

    const deMarket = { country: 'de', locale: 'de' }
    const { result, rerender } = renderHook(
      ({ currentMarket }: { currentMarket: typeof market }) =>
        useCustomerCreditCardDeletionController({
          errorMessage: 'Unable to delete card.',
          market: currentMarket,
        }),
      {
        initialProps: { currentMarket: market },
        wrapper: createHarness(),
      },
    )

    act(() => {
      result.current.deleteCard('card_ada')
    })
    await waitFor(() =>
      expect(server.deleteCustomerCreditCard).toHaveBeenCalledOnce(),
    )

    rerender({ currentMarket: deMarket })
    act(() => {
      result.current.deleteCard('card_ada')
    })
    await waitFor(() =>
      expect(server.deleteCustomerCreditCard).toHaveBeenCalledTimes(2),
    )

    await act(async () => {
      resolveUsDelete()
      await Promise.resolve()
    })
    expect(result.current.isPendingForCard('card_ada')).toBe(true)

    await act(async () => {
      resolveDeDelete()
      await waitFor(() =>
        expect(result.current.isPendingForCard('card_ada')).toBe(false),
      )
    })
  })

  it('redirects after profile update loses the customer session', async () => {
    server.updateCustomerProfile.mockRejectedValue(sessionRequiredError())

    const { result } = renderHook(() => useAccountProfileFormController(), {
      wrapper: createHarness(),
    })

    act(() => {
      result.current.submit({
        acceptsEmailMarketing: false,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: '',
      })
    })

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledTimes(1))

    expect(result.current.state.error).toBe(false)
    expect(server.updateCustomerProfile).toHaveBeenCalledWith({
      data: {
        acceptsEmailMarketing: false,
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        market,
        phone: '',
      },
    })
  })

  it('keeps a profile update successful when the refresh callback fails', async () => {
    server.updateCustomerProfile.mockResolvedValue(customer)
    const onUpdated = vi.fn().mockRejectedValue(new Error('refresh failed'))

    const { result } = renderHook(
      () => useCustomerProfileUpdate({ market, onUpdated }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          data: {
            acceptsEmailMarketing: false,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: '',
          },
        }),
      ).resolves.toEqual(customer)
    })

    expect(onUpdated).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.isError).toBe(false)
    })
  })

  it('keeps the profile request error when the error callback fails', async () => {
    const requestError = new Error('profile request failed')
    server.updateCustomerProfile.mockRejectedValue(requestError)
    const onError = vi
      .fn()
      .mockRejectedValue(new Error('error callback failed'))

    const { result } = renderHook(
      () => useCustomerProfileUpdate({ market, onError }),
      { wrapper: createHarness() },
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          data: {
            acceptsEmailMarketing: false,
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: '',
          },
        }),
      ).rejects.toBe(requestError)
    })

    expect(onError).toHaveBeenCalledWith(requestError, undefined)
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('serializes profile updates for the same market', async () => {
    let resolveFirstUpdate: () => void = () => undefined
    server.updateCustomerProfile.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveFirstUpdate = resolve
      }),
    )
    server.updateCustomerProfile.mockResolvedValueOnce(customer)

    const { result } = renderHook(
      () => ({
        first: useCustomerProfileUpdate({ market }),
        second: useCustomerProfileUpdate({ market }),
      }),
      { wrapper: createHarness() },
    )

    let firstPromise: Promise<unknown> | undefined
    let secondPromise: Promise<unknown> | undefined
    act(() => {
      firstPromise = result.current.first.mutateAsync({
        acceptsEmailMarketing: false,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: '',
      })
      secondPromise = result.current.second.mutateAsync({
        acceptsEmailMarketing: false,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: '',
      })
    })

    await waitFor(() =>
      expect(server.updateCustomerProfile).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveFirstUpdate()
      await firstPromise
      await secondPromise
    })

    expect(server.updateCustomerProfile).toHaveBeenCalledTimes(2)
  })

  it('ignores a duplicate profile update while the first request is in flight', async () => {
    let resolveUpdate: (value: typeof customer) => void = () => undefined
    server.updateCustomerProfile.mockReturnValueOnce(
      new Promise<typeof customer>((resolve) => {
        resolveUpdate = resolve
      }),
    )

    const { result } = renderHook(() => useAccountProfileFormController(), {
      wrapper: createHarness(),
    })

    const profileInput = {
      acceptsEmailMarketing: false,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: '',
    }
    act(() => {
      result.current.submit(profileInput)
      result.current.submit(profileInput)
    })

    await waitFor(() =>
      expect(server.updateCustomerProfile).toHaveBeenCalledOnce(),
    )
    expect(result.current.state.isPending).toBe(true)

    await act(async () => {
      resolveUpdate(customer)
      await waitFor(() => expect(result.current.state.isPending).toBe(false))
    })
  })

  it('ignores a same-tick profile update from another observer', async () => {
    let resolveUpdate: (value: typeof customer) => void = () => undefined
    server.updateCustomerProfile.mockReturnValueOnce(
      new Promise<typeof customer>((resolve) => {
        resolveUpdate = resolve
      }),
    )

    const profileInput = {
      acceptsEmailMarketing: false,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: '',
    }
    const { result } = renderHook(
      () => ({
        first: useAccountProfileFormController(),
        second: useAccountProfileFormController(),
      }),
      { wrapper: createHarness() },
    )

    act(() => {
      result.current.first.submit(profileInput)
      result.current.second.submit(profileInput)
    })

    await waitFor(() =>
      expect(server.updateCustomerProfile).toHaveBeenCalledOnce(),
    )

    await act(async () => {
      resolveUpdate(customer)
      await waitFor(() =>
        expect(result.current.first.state.isPending).toBe(false),
      )
    })

    expect(server.updateCustomerProfile).toHaveBeenCalledOnce()
  })

  it('isolates profile projection across customer transitions', async () => {
    let resolveUpdate: (value: typeof customer) => void = () => undefined
    server.updateCustomerProfile.mockReturnValueOnce(
      new Promise<typeof customer>((resolve) => {
        resolveUpdate = resolve
      }),
    )

    const profileInput = {
      acceptsEmailMarketing: false,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: '',
    }
    const { result, rerender } = renderHook(
      ({ version }: { version: number }) => {
        void version
        return useAccountProfileFormController()
      },
      { initialProps: { version: 0 }, wrapper: createHarness() },
    )

    act(() => {
      result.current.submit(profileInput)
    })
    await waitFor(() =>
      expect(server.updateCustomerProfile).toHaveBeenCalledOnce(),
    )

    customer.id = 'cust_grace'
    rerender({ version: 1 })
    await waitFor(() =>
      expect(result.current.state.savedMessageVisible).toBe(false),
    )
    expect(result.current.state.isPending).toBe(false)

    await act(async () => {
      resolveUpdate(customer)
      await waitFor(() => expect(result.current.state.isPending).toBe(false))
    })

    expect(result.current.customer.id).toBe('cust_grace')
    expect(result.current.state.savedMessageVisible).toBe(false)
  })
})
