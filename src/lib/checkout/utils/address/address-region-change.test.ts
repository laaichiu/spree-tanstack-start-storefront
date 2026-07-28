import { describe, expect, it } from 'vitest'

import {
  getCheckoutCountryChangeValues,
  getCheckoutStateAbbrChangeValues,
  getCheckoutStateNameChangeValues,
} from './address-region-change'

describe('checkout address region change helpers', () => {
  it('clears both state fields when the country changes', () => {
    expect(getCheckoutCountryChangeValues('CA')).toEqual({
      countryIso: 'CA',
      stateAbbr: '',
      stateName: '',
    })
  })

  it('clears free-text state when a state option is selected', () => {
    expect(getCheckoutStateAbbrChangeValues('NY')).toEqual({
      stateAbbr: 'NY',
      stateName: '',
    })
  })

  it('clears selected state when a free-text state is entered', () => {
    expect(getCheckoutStateNameChangeValues('Ontario')).toEqual({
      stateAbbr: '',
      stateName: 'Ontario',
    })
  })
})
