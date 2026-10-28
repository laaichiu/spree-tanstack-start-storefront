export type StatusLabels = Readonly<Record<string, string>>

export function formatStatusLabel(
  status: string | null | undefined,
  fallback = '-',
  labels?: StatusLabels,
) {
  if (!status) {
    return fallback
  }

  if (labels && Object.hasOwn(labels, status) && labels[status]) {
    return labels[status]
  }

  return status
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}
