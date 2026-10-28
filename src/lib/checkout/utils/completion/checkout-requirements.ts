import {
  getCheckoutRequirementErrorMessage,
  getBlockingCheckoutRequirements,
  groupCheckoutRequirementsBySection,
} from '@/lib/checkout/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'

import { readCheckoutMutationErrorMessage } from '../checkout-error'

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

  const safeRequirements = requirements.map((requirement) => ({
    ...requirement,
    message: readCheckoutMutationErrorMessage(
      requirement.message,
      fallbackMessage,
    ),
  }))

  return {
    message: getCheckoutRequirementErrorMessage(
      safeRequirements,
      fallbackMessage,
    ),
    sectionErrors: groupCheckoutRequirementsBySection(safeRequirements),
  }
}
