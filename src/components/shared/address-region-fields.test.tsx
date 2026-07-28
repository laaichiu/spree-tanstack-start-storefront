import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AddressStateField } from './address-region-fields'

const addressCountryQueryState = vi.hoisted(() => ({
  data: undefined as
    | { states: Array<{ abbr: string; name: string }> }
    | undefined,
  isLoading: true,
}))

vi.mock('@/components/shared/use-address-countries', () => ({
  useAddressCountry: () => addressCountryQueryState,
}))

afterEach(() => {
  cleanup()
  addressCountryQueryState.data = undefined
  addressCountryQueryState.isLoading = true
})

const labels = {
  loadingStates: 'Loading states',
  state: 'State',
  statePlaceholder: 'Select state',
  stateTextPlaceholder: 'State or province',
}

function renderStateField() {
  return render(
    <AddressStateField
      countryIso="US"
      inputId="state-name"
      labels={labels}
      onStateAbbrChange={vi.fn()}
      onStateNameChange={vi.fn()}
      selectId="state-abbr"
      stateAbbr=""
      stateName=""
    />,
  )
}

describe('AddressStateField', () => {
  it('keeps the loading input controlled while country states load', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const { rerender } = renderStateField()

    expect(screen.getByLabelText('State').getAttribute('value')).toBe('')

    addressCountryQueryState.data = { states: [] }
    addressCountryQueryState.isLoading = false
    rerender(
      <AddressStateField
        countryIso="US"
        inputId="state-name"
        labels={labels}
        onStateAbbrChange={vi.fn()}
        onStateNameChange={vi.fn()}
        selectId="state-abbr"
        stateAbbr=""
        stateName=""
      />,
    )

    expect(screen.getByLabelText('State').getAttribute('value')).toBe('')
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining('changing the uncontrolled value state'),
    )

    consoleError.mockRestore()
  })
})
