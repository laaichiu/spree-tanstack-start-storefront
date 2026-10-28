export function HeaderBrandView({
  logoUrl,
  name,
}: {
  logoUrl: string | null
  name: string
}) {
  return logoUrl ? (
    <img
      alt={name}
      className="h-8 w-auto object-contain xl:h-7"
      height={76}
      src={logoUrl}
      width={189}
    />
  ) : (
    <span className="text-base leading-none font-semibold uppercase tracking-[0.16em]">
      {name}
    </span>
  )
}
