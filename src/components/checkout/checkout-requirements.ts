import type {
  CheckoutOrder,
  CheckoutRequirement,
} from '@/lib/checkout/model/checkout'

export type CheckoutSectionErrorKey = 'address' | 'payment' | 'shipping'

export type CheckoutSectionErrors = Partial<
  Record<CheckoutSectionErrorKey, string[]>
>

const checkoutSectionErrorOrder: CheckoutSectionErrorKey[] = [
  'address',
  'shipping',
  'payment',
]

export function getBlockingCheckoutRequirements(order: CheckoutOrder) {
  return order.requirements.filter(
    (requirement) => requirement.step !== 'payment',
  )
}

export function getCheckoutRequirementErrorMessage(
  requirements: CheckoutRequirement[],
  fallback: string,
) {
  return requirements[0]?.message || fallback
}

export function getCheckoutRequirementSection(
  requirement: CheckoutRequirement,
): CheckoutSectionErrorKey {
  if (requirement.step === 'delivery') {
    return 'shipping'
  }

  if (requirement.step === 'payment') {
    return 'payment'
  }

  return 'address'
}

export function groupCheckoutRequirementsBySection(
  requirements: CheckoutRequirement[],
): CheckoutSectionErrors {
  return requirements.reduce<CheckoutSectionErrors>((sectionErrors, item) => {
    const section = getCheckoutRequirementSection(item)

    return {
      ...sectionErrors,
      [section]: [...(sectionErrors[section] ?? []), item.message],
    }
  }, {})
}

export function getBlockingCheckoutRequirementsNotice({
  fallbackMessage,
  order,
}: {
  fallbackMessage: string
  order: CheckoutOrder
}) {
  const requirements = getBlockingCheckoutRequirements(order)

  if (requirements.length === 0) {
    return null
  }

  return {
    message: getCheckoutRequirementErrorMessage(requirements, fallbackMessage),
    sectionErrors: groupCheckoutRequirementsBySection(requirements),
  }
}

export function getSingleCheckoutSectionErrors(
  section: CheckoutSectionErrorKey,
  message: string,
): CheckoutSectionErrors {
  return {
    [section]: [message],
  }
}

export function removeCheckoutSectionError(
  sectionErrors: CheckoutSectionErrors,
  section: CheckoutSectionErrorKey,
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
) {
  return checkoutSectionErrorOrder.find(
    (section) => (sectionErrors[section]?.length ?? 0) > 0,
  )
}

export function getCheckoutSectionElementId(section: CheckoutSectionErrorKey) {
  return `checkout-section-${section}`
}
