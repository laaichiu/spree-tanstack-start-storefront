import { useEffect, useState } from 'react'

export function CountryFlagView({
  countryCode,
  fallbackFlag,
}: {
  countryCode: string
  fallbackFlag: string
}) {
  const [hasImageError, setHasImageError] = useState(false)

  useEffect(() => {
    setHasImageError(false)
  }, [countryCode])

  if (!countryCode || hasImageError) {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-base leading-none shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        {fallbackFlag}
      </span>
    )
  }

  return (
    <span className="block h-4 w-4 overflow-hidden rounded-full border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
      <img
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        onError={() => setHasImageError(true)}
        src={`/flags/1x1/${countryCode}.svg`}
      />
    </span>
  )
}
