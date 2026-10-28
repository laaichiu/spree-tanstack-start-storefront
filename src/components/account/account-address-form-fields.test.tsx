import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { AddressFormFields } from './account-address-form-fields'
import { useAccountAddressFormController } from './use-account-address-form-controller'

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({ t: (key: string) => key }),
}))

vi.mock('@/components/shared/address-region-fields', () => ({
  AddressRegionFields: ({
    countryIso,
    disabled,
    onCountryChange,
    onStateAbbrChange,
    onStateNameChange,
    stateAbbr,
    stateName,
  }: {
    countryIso: string
    disabled: boolean
    onCountryChange: (value: string) => void
    onStateAbbrChange: (value: string) => void
    onStateNameChange: (value: string) => void
    stateAbbr: string
    stateName: string
  }) => (
    <div>
      <p data-testid="region">{`${countryIso}|${stateAbbr}|${stateName}`}</p>
      <button
        disabled={disabled}
        onClick={() => onCountryChange('CA')}
        type="button"
      >
        Change country
      </button>
      <button
        disabled={disabled}
        onClick={() => onStateAbbrChange('NY')}
        type="button"
      >
        Select state
      </button>
      <button
        disabled={disabled}
        onClick={() => onStateNameChange('New York')}
        type="button"
      >
        Enter state name
      </button>
    </div>
  ),
}))

function AddressForm({
  isPending = false,
  onSubmit,
}: {
  isPending?: boolean
  onSubmit: (values: CustomerAddressInput) => void
}) {
  const { control, errors, register, setValue, submit } =
    useAccountAddressFormController({
      address: null,
      fallbackCountry: 'US',
      onSubmit,
    })

  return (
    <form onSubmit={submit}>
      <AddressFormFields
        control={control}
        errors={errors}
        isPending={isPending}
        open
        register={register}
        setValue={setValue}
      />
      <button type="submit">Save</button>
    </form>
  )
}

afterEach(cleanup)

describe('account address form fields', () => {
  it('validates required fields and submits the selected defaults and region', async () => {
    const onSubmit = vi.fn()
    render(<AddressForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('First name is required.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('account.firstName'), {
      target: { value: 'Ada' },
    })
    fireEvent.change(screen.getByLabelText('account.lastName'), {
      target: { value: 'Lovelace' },
    })
    fireEvent.change(screen.getByLabelText('account.addressLine1'), {
      target: { value: '1 Main Street' },
    })
    fireEvent.change(screen.getByLabelText('account.city'), {
      target: { value: 'Toronto' },
    })
    fireEvent.change(screen.getByLabelText('account.postalCode'), {
      target: { value: 'M5V 1A1' },
    })
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'account.defaultShipping' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Select state' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enter state name' }))
    expect(screen.getByTestId('region').textContent).toBe('US|NY|New York')
    fireEvent.click(screen.getByRole('button', { name: 'Change country' }))
    expect(screen.getByTestId('region').textContent).toBe('CA||')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        address1: '1 Main Street',
        city: 'Toronto',
        countryIso: 'CA',
        firstName: 'Ada',
        isDefaultBilling: false,
        isDefaultShipping: true,
        lastName: 'Lovelace',
        postalCode: 'M5V 1A1',
        stateAbbr: '',
        stateName: '',
      }),
    )
  })

  it('disables address controls while saving', () => {
    render(<AddressForm isPending onSubmit={vi.fn()} />)

    expect(
      screen.getByLabelText('account.firstName').hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen
        .getByRole('checkbox', { name: 'account.defaultBilling' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      screen
        .getByRole('button', { name: 'Change country' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})
