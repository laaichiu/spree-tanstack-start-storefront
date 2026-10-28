import type { CheckoutRequirementSection } from '@/lib/checkout/contracts'

export function getCheckoutSectionElementId(
  section: CheckoutRequirementSection,
) {
  return `checkout-section-${section}`
}
