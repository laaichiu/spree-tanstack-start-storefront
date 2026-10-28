import type { CheckoutOrder, CheckoutRequirement } from './checkout'

export type CheckoutRequirementSection = 'address' | 'payment' | 'shipping'

export function getBlockingCheckoutRequirements(
  order: Pick<CheckoutOrder, 'requirements'>,
) {
  return order.requirements.filter(
    (requirement) => requirement.step !== 'payment',
  )
}

export function getCheckoutRequirementSection(
  requirement: Pick<CheckoutRequirement, 'step'>,
): CheckoutRequirementSection {
  if (requirement.step === 'delivery') {
    return 'shipping'
  }

  if (requirement.step === 'payment') {
    return 'payment'
  }

  return 'address'
}
