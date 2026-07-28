import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AccountSectionControllerValue } from '@/components/account/account-section-controller'
import { AccountSectionReferenceView } from '@/components/account/account-section-reference-view'
import {
  AccountSessionProvider,
  useAccountSession,
} from '@/components/account/account-session-provider'
import { MarketProvider } from '@/components/layout/market-provider'
import type { CustomerProfile } from '@/lib/account/model/customer'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => (
    <a className={className} href="/fixture-link">
      {children}
    </a>
  ),
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

function SessionProbe() {
  const activeCustomer = useAccountSession()

  return <output>{activeCustomer.email}</output>
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('account section reference composition', () => {
  it('renders normalized identity, navigation, content, and sign-out action', () => {
    const signOut = vi.fn(async () => undefined)
    const controller: AccountSectionControllerValue = {
      account: {
        displayName: 'Chris Lee',
        email: 'chris@example.com',
      },
      session: {
        error: null,
        isSigningOut: false,
        signOut,
      },
    }

    render(
      <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
        <AccountSectionReferenceView
          activeSection="orders"
          controller={controller}
        >
          <p>Order history content</p>
        </AccountSectionReferenceView>
      </MarketProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Chris Lee' }),
    ).toBeTruthy()
    expect(screen.getByText('chris@example.com')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Orders' })).toBeTruthy()
    expect(screen.getByText('Order history content')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('provides only the normalized customer inside the protected layout', () => {
    render(
      <AccountSessionProvider customer={customer}>
        <SessionProbe />
      </AccountSessionProvider>,
    )

    expect(screen.getByText('chris@example.com')).toBeTruthy()
  })
})

it('keeps account presentation outside session and commerce infrastructure', () => {
  const presentationFiles = [
    'account-section-shell.tsx',
    'account-section-reference-view.tsx',
    'account-session-provider.tsx',
  ]
  const source = presentationFiles
    .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
    .join('\n')

  expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
  expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
  expect(source).not.toMatch(/\.server(?:'|")/)
  expect(source).not.toMatch(/token|queryClient|serverFn/)
  expect(source).not.toContain('logoutCustomer')
})
