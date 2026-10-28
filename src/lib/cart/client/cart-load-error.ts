export function hasCartLoadError({
  error,
  initialCartLoadError,
  isFetched,
}: {
  error: unknown
  initialCartLoadError?: string | null
  isFetched: boolean
}): boolean {
  return Boolean(error ?? (!isFetched ? initialCartLoadError : null))
}
