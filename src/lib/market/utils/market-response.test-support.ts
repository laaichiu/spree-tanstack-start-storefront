export function marketResource(overrides: Record<string, unknown> = {}) {
  return {
    country_codes: ['US'],
    currency: 'USD',
    default: true,
    default_locale: 'en',
    id: 'mkt_us',
    name: 'United States',
    supported_locales: ['en'],
    tax_inclusive: false,
    ...overrides,
  }
}
