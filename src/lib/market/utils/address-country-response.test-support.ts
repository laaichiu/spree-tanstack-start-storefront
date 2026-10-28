export function addressCountryResource(
  overrides: Record<string, unknown> = {},
) {
  return {
    iso: 'US',
    iso3: 'USA',
    name: 'United States',
    states_required: true,
    zipcode_required: true,
    ...overrides,
  }
}
