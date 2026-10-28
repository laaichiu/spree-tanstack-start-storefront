import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  formatCountryName,
  formatLocaleLabel,
  getMarketCollator,
} from './market-format'

afterEach(() => vi.restoreAllMocks())

describe('reference names in the reader locale', () => {
  it('localizes countries and regional languages from their codes', () => {
    expect(formatCountryName(' us ', 'fr')).toBe('États-Unis')
    expect(formatCountryName('DE', 'ja')).toBe('ドイツ')
    expect(formatLocaleLabel('en', 'fr')).toBe('anglais')
    expect(formatLocaleLabel('pt-br', 'en')).toBe('Brazilian Portuguese')
  })

  it('reuses display names and collators across option lists', () => {
    const constructor = vi.spyOn(Intl, 'DisplayNames')
    formatCountryName('US', 'it')
    formatCountryName('DE', 'it')
    formatCountryName('US', 'it')
    expect(constructor).toHaveBeenCalledTimes(1)
    expect(getMarketCollator('it')).toBe(getMarketCollator('it'))
    expect(getMarketCollator('it')).not.toBe(getMarketCollator('ja'))
  })

  it('preserves readable code fallbacks for malformed reference inputs', () => {
    expect(formatCountryName('??', 'fr')).toBe('??')
    expect(formatLocaleLabel('bad-_-code', 'fr')).toBe('bad---code')
  })
})
