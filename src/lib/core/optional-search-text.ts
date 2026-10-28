export function parseOptionalTrimmedSearchText(
  value: unknown,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue || undefined
}
