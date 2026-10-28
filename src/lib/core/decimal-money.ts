export function isDecimalMoneyAmount(value: unknown): value is string {
  return typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)
}

export function isNullableDecimalMoneyAmount(
  value: unknown,
): value is string | null {
  return value === null || isDecimalMoneyAmount(value)
}
