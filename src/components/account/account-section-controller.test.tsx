import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccountSectionController } from '@/components/account/account-section-controller'
import { MarketProvider } from '@/components/layout/market-provider'
import type { CustomerProfile } from '@/lib/account/model/customer'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

const runtime = vi.hoisted(() => ({
  invalidate: vi.fn(async () => undefined),
  logoutCustomer: vi.fn(async () => ({ success: true })),
  navigate: vi.fn(async () => undefined),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    invalidate: runtime.invalidate,
    navigate: runtime.navigate,
  }),
}))

vi.mock('@/lib/account/api/customer-session.functions', () => ({
  logoutCustomer: runtime.logoutCustomer,
}))

const customer = {
  acceptsEmailMarketing: false,
  availableStoreCreditTotal: null,
  displayAvailableStoreCreditTotal: null,
  email: 'chris@example.com',
  firstName: 'Chris',
  id: 'customer-1',
  lastName: 'Lee',
  phone: null,
} satisfies CustomerProfile

function renderController(activeCustomer: CustomerProfile = customer) {
  return render(
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      <AccountSectionController customer={activeCustomer}>
        {(controller) => (
          <div>
            <output data-testid="display-name">
              {controller.account.displayName}
            </output>
            <output data-testid="email">{controller.account.email}</output>
            <output data-testid="error">
              {controller.session.error ?? 'none'}
            </output>
            <button onClick={() => void controller.session.signOut()}>
              Sign out
            </button>
          </div>
        )}
      </AccountSectionController>
    </MarketProvider>,
  )
}

beforeEach(() => {
  runtime.logoutCustomer.mockResolvedValue({ success: true })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AccountSectionController', () => {
  it('exposes a normalized account identity and safe sign-out capability', async () => {
    renderController()

    expect(screen.getByTestId('display-name').textContent).toBe('Chris Lee')
    expect(screen.getByTestId('email').textContent).toBe('chris@example.com')

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(runtime.navigate).toHaveBeenCalledWith({
        href: '/us/en/account/login',
      })
    })
    expect(runtime.logoutCustomer).toHaveBeenCalledOnce()
    expect(runtime.invalidate).toHaveBeenCalledOnce()
    expect(screen.getByTestId('error').textContent).toBe('none')
  })

  it('keeps sign-out failures inside a stable friendly error', async () => {
    runtime.logoutCustomer.mockRejectedValue(new Error('Raw network failure'))
    renderController({ ...customer, firstName: null, lastName: null })

    expect(screen.getByTestId('display-name').textContent).toBe('My account')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        "We couldn't sign you out. Please try again.",
      )
    })
    expect(runtime.invalidate).not.toHaveBeenCalled()
    expect(runtime.navigate).not.toHaveBeenCalled()
  })
})
