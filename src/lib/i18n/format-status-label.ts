export function formatStatusLabel(
  status: string | null | undefined,
  fallback = '-',
) {
  if (!status) {
    return fallback
  }

  return status
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}
