export function ProductReviewsLoadingStateView({
  sectionId,
}: {
  sectionId: string
}) {
  return (
    <div
      aria-hidden="true"
      className="mt-14 h-48 scroll-mt-32 animate-pulse bg-muted motion-reduce:animate-none lg:mt-20 xl:scroll-mt-24"
      id={sectionId}
    />
  )
}
