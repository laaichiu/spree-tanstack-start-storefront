import type { CheckoutRequirement } from './checkout'
import type { CheckoutRequirementSection } from './requirements'
import { getCheckoutRequirementSection } from './requirements'

export type CheckoutSectionErrors = Partial<
  Record<CheckoutRequirementSection, string[]>
>

const checkoutSectionErrorOrder: CheckoutRequirementSection[] = [
  'address',
  'shipping',
  'payment',
]

export function getCheckoutRequirementErrorMessage(
  requirements: readonly CheckoutRequirement[],
  fallback: string,
): string {
  return requirements[0]?.message || fallback
}

export function groupCheckoutRequirementsBySection(
  requirements: readonly CheckoutRequirement[],
): CheckoutSectionErrors {
  return requirements.reduce<CheckoutSectionErrors>((sectionErrors, item) => {
    const section = getCheckoutRequirementSection(item)

    return {
      ...sectionErrors,
      [section]: [...(sectionErrors[section] ?? []), item.message],
    }
  }, {})
}

export function getSingleCheckoutSectionErrors(
  section: CheckoutRequirementSection,
  message: string,
): CheckoutSectionErrors {
  return {
    [section]: [message],
  }
}

export function removeCheckoutSectionError(
  sectionErrors: CheckoutSectionErrors,
  section: CheckoutRequirementSection,
): CheckoutSectionErrors {
  if (!sectionErrors[section]?.length) {
    return sectionErrors
  }

  const nextSectionErrors = { ...sectionErrors }
  delete nextSectionErrors[section]

  return nextSectionErrors
}

export function getFirstCheckoutSectionWithErrors(
  sectionErrors: CheckoutSectionErrors,
): CheckoutRequirementSection | undefined {
  return checkoutSectionErrorOrder.find(
    (section) => (sectionErrors[section]?.length ?? 0) > 0,
  )
}
