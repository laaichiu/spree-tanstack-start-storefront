function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getCustomerRequestRecord(
  value: unknown,
): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}
