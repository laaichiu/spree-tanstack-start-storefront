import { cleanup, fireEvent, render } from '@testing-library/react'
import { Profiler } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCheckoutAddressFormState } from './use-checkout-address-form-state'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'
import { checkoutAddressSchema } from '@/lib/checkout/validation/address'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: {
      country: 'US',
    },
  }),
}))

const checkoutOrder = {
  billingAddress: null,
  email: null,
  id: 'order-1',
  shippingAddress: null,
  shippingMatchesBillingAddress: true,
} as CheckoutOrder

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('useCheckoutAddressFormState render profile', () => {
  it('does not re-parse completeness for an optional field outside the subscription', () => {
    const phases: Array<'mount' | 'nested-update' | 'update'> = []
    const safeParseSpy = vi.spyOn(checkoutAddressSchema, 'safeParse')
    function AddressStateHarness() {
      const { form } = useCheckoutAddressFormState({
        cart: checkoutOrder,
        customerEmail: null,
        savedAddresses: [],
      })

      return (
        <form>
          <input aria-label="Company" {...form.register('company')} />
          <input aria-label="City" {...form.register('city')} />
        </form>
      )
    }

    const { getByRole } = render(
      <Profiler
        id="checkout-address-form-state"
        onRender={(_, phase) => phases.push(phase)}
      >
        <AddressStateHarness />
      </Profiler>,
    )

    const initialCommitCount = phases.length
    const initialParseCount = safeParseSpy.mock.calls.length

    fireEvent.change(getByRole('textbox', { name: 'Company' }), {
      target: { value: 'Evergreen Studio' },
    })

    expect(phases).toHaveLength(initialCommitCount)
    expect(safeParseSpy).toHaveBeenCalledTimes(initialParseCount)

    fireEvent.change(getByRole('textbox', { name: 'City' }), {
      target: { value: 'San Diego' },
    })

    expect(phases).toHaveLength(initialCommitCount + 1)
    expect(safeParseSpy).toHaveBeenCalledTimes(initialParseCount + 1)
    expect(phases.at(-1)).toBe('update')
  })
})
