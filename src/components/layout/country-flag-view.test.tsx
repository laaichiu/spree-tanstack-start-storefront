import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CountryFlagView } from './country-flag-view'

afterEach(cleanup)

describe('CountryFlagView', () => {
  it('retries the flag image when the country changes after an error', () => {
    const { rerender } = render(
      <CountryFlagView countryCode="us" fallbackFlag="🇺🇸" />,
    )

    fireEvent.error(screen.getByRole('presentation', { hidden: true }))
    expect(screen.queryByRole('presentation', { hidden: true })).toBeNull()

    rerender(<CountryFlagView countryCode="de" fallbackFlag="🇩🇪" />)

    expect(
      screen.getByRole('presentation', { hidden: true }).getAttribute('src'),
    ).toBe('/flags/1x1/de.svg')
  })
})
