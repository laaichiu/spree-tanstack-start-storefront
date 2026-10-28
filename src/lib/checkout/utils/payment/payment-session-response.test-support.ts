export function paymentSessionResource(
  overrides: Record<string, unknown> = {},
) {
  return {
    currency: 'USD',
    external_data: {},
    external_id: 'external_123',
    id: 'ps_123',
    order_id: 'or_123',
    payment_method_id: 'pm_123',
    status: 'processing',
    ...overrides,
  }
}
