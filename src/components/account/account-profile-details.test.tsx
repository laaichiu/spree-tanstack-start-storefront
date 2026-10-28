import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountProfileDetails } from './account-profile-details'

const server = vi.hoisted(() => ({
  invalidate: vi.fn(),
  updateProfile: vi.fn(),
}))

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

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => key,
  }),
}))
vi.mock('@/lib/account/client/account-session-provider', () => ({
  useAccountSession: () => customer,
  useAccountSessionRequiredRedirect: () => vi.fn(),
}))
vi.mock('@/lib/account/api/customer-session.functions', () => ({
  updateCustomerProfile: server.updateProfile,
}))
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: server.invalidate }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('account profile', () => {
  it('validates, saves, and resets a changed profile', async () => {
    let resolveUpdate: (value: typeof customer) => void = () => undefined
    server.updateProfile.mockReturnValueOnce(
      new Promise<typeof customer>((resolve) => {
        resolveUpdate = resolve
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AccountProfileDetails />
      </QueryClientProvider>,
    )

    const save = screen.getByRole('button', { name: 'account.saveProfile' })
    expect(save.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('account.email'), {
      target: { value: 'invalid' },
    })
    fireEvent.submit(save.closest('form')!)
    expect(await screen.findByText('account.invalidEmail')).toBeTruthy()
    expect(server.updateProfile).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('account.email'), {
      target: { value: 'ada.updated@example.com' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: /account\.marketingOptIn/ }),
    )
    fireEvent.click(save)

    await waitFor(() => expect(server.updateProfile).toHaveBeenCalledOnce())
    expect(server.updateProfile).toHaveBeenCalledWith({
      data: {
        acceptsEmailMarketing: true,
        email: 'ada.updated@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        market: { country: 'us', locale: 'en' },
        phone: '',
      },
    })
    expect(
      screen
        .getByRole('button', { name: 'account.savingProfile' })
        .hasAttribute('disabled'),
    ).toBe(true)

    await act(async () => {
      resolveUpdate({
        ...customer,
        acceptsEmailMarketing: true,
        email: 'ada.updated@example.com',
      })
    })

    expect(await screen.findByText('account.profileSaved')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'account.saveProfile' })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(server.invalidate).toHaveBeenCalledOnce()
  })
})
