export function scrollToProductReviewTarget(targetId: string) {
  const target = document.getElementById(targetId)

  if (!target) {
    return
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'instant' : 'smooth',
    block: 'start',
  })
}
