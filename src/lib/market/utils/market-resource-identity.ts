import { isCountryCode } from '@/lib/core/market'

export const MARKET_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a market resource.'
export const MARKET_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The market response is malformed.'

export class MarketResourceTypeMismatchError extends Error {
  constructor() {
    super(MARKET_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'MarketResourceTypeMismatchError'
  }
}

export class MarketResponseTypeMismatchError extends Error {
  constructor() {
    super(MARKET_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'MarketResponseTypeMismatchError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isMarketCountry(value: unknown): value is { iso: string } {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.iso === 'string' && isCountryCode(value.iso)
}

function isMarketResponse(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  const countries = value.countries
  const countryCodes = value.country_codes

  return (
    isMarketResourceId(value.id) &&
    isNonBlankString(value.name) &&
    isNonBlankString(value.currency) &&
    isNonBlankString(value.default_locale) &&
    typeof value.tax_inclusive === 'boolean' &&
    typeof value.default === 'boolean' &&
    isStringArray(countryCodes) &&
    isStringArray(value.supported_locales) &&
    (countries === undefined ||
      (Array.isArray(countries) &&
        countries.every(
          (country) =>
            isMarketCountry(country) &&
            countryCodes.some(
              (code) =>
                code.trim().toUpperCase() === country.iso.trim().toUpperCase(),
            ),
        )))
  )
}

export function isMarketResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('mkt_') &&
    value.length > 'mkt_'.length
  )
}

export function assertMarketResourceIsMarket(resource: unknown) {
  if (!isRecord(resource) || !isMarketResourceId(resource.id)) {
    throw new MarketResourceTypeMismatchError()
  }
}

export function assertMarketResponse(
  response: unknown,
): asserts response is Record<string, unknown> {
  assertMarketResourceIsMarket(response)

  if (!isMarketResponse(response)) {
    throw new MarketResponseTypeMismatchError()
  }
}
