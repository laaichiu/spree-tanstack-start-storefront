import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AccountSessionProvider,
  useAccountSessionRequiredRedirect,
} from './account-session-provider'

const redirectToLogin = vi.fn().mockResolvedValue(undefined)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AccountSessionProvider session redirect', () => {
  it('exposes the route-provided session redirect to account controllers', async () => {
    function Probe() {
      const sessionRedirect = useAccountSessionRequiredRedirect()

      return (
        <button onClick={() => void sessionRedirect()} type="button">
          Re-authenticate
        </button>
      )
    }

    render(
      <AccountSessionProvider
        customer={{
          acceptsEmailMarketing: false,
          availableStoreCreditTotal: null,
          displayAvailableStoreCreditTotal: null,
          email: 'ada@example.com',
          firstName: 'Ada',
          id: 'cust_ada',
          lastName: 'Lovelace',
          phone: null,
        }}
        onSessionRequired={redirectToLogin}
      >
        <Probe />
      </AccountSessionProvider>,
    )

    fireEvent.click(document.querySelector('button')!)

    expect(redirectToLogin).toHaveBeenCalledTimes(1)
  })
})
